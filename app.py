#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, render_template_string
import subprocess
import os
import json
import shlex
from urllib.parse import urlparse
import threading
import time
from datetime import datetime
import uuid

app = Flask(__name__)

# Diretório para salvar os downloads
DOWNLOAD_DIR = os.path.join(os.getcwd(), 'downloads')

# Criar diretório de downloads se não existir
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# Sistema de fila de downloads
download_queue = []
queue_lock = threading.Lock()
queue_status = {
    'is_processing': False,
    'current_download': None,
    'completed': [],
    'failed': []
}

@app.route('/')
def index():
    """Serve a página principal"""
    with open('index.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/style.css')
def style():
    """Serve o arquivo CSS"""
    with open('style.css', 'r', encoding='utf-8') as f:
        content = f.read()
    return content, 200, {'Content-Type': 'text/css'}

@app.route('/script.js')
def script():
    """Serve o arquivo JavaScript"""
    with open('script.js', 'r', encoding='utf-8') as f:
        content = f.read()
    return content, 200, {'Content-Type': 'application/javascript'}

def process_download_queue():
    """Processa a fila de downloads em thread separada"""
    global queue_status
    
    while True:
        with queue_lock:
            if download_queue and not queue_status['is_processing']:
                queue_status['is_processing'] = True
                download_item = download_queue.pop(0)
                queue_status['current_download'] = download_item
        
        if queue_status['is_processing']:
            try:
                # Executar download
                result = execute_download(
                    download_item['video_url'], 
                    download_item['referer_url'],
                    download_item.get('download_type', 'video')
                )
                
                download_item['completed_at'] = datetime.now().isoformat()
                download_item['output'] = result['output']
                
                if result['success']:
                    download_item['status'] = 'completed'
                    queue_status['completed'].append(download_item)
                else:
                    download_item['status'] = 'failed'
                    download_item['error'] = result['error']
                    queue_status['failed'].append(download_item)
                    
            except Exception as e:
                download_item['status'] = 'failed'
                download_item['error'] = str(e)
                download_item['completed_at'] = datetime.now().isoformat()
                queue_status['failed'].append(download_item)
            
            finally:
                queue_status['is_processing'] = False
                queue_status['current_download'] = None
        
        time.sleep(1)  # Verificar fila a cada segundo

def get_video_title(video_url, referer_url=None):
    """Extrai o título do vídeo usando yt-dlp"""
    try:
        cmd = [
            'yt-dlp',
            '--get-title'
        ]
        
        # Adicionar referer apenas se fornecido
        if referer_url:
            cmd.extend(['--referer', referer_url])
        
        cmd.append(video_url)
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30  # Timeout de 30 segundos para obter título
        )
        
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        else:
            return None
    except Exception as e:
        print(f"Erro ao obter título: {e}")
        return None

def execute_download(video_url, referer_url=None, download_type='video'):
    """Executa o download de um vídeo ou áudio"""
    try:
        # Construir comando yt-dlp baseado no tipo
        cmd = ['yt-dlp']

        if download_type == 'audio':
            cmd.extend(['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3'])
        else:  # video completo
            cmd.extend(['-f', 'bv*+ba/b', '--merge-output-format', 'mp4'])

        # Adicionar referer apenas se fornecido
        if referer_url:
            cmd.extend(['--referer', referer_url])

        cmd.extend(['-o', os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'), video_url])

        # Executar comando
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # Timeout de 5 minutos
        )

        output = result.stdout + result.stderr

        if result.returncode == 0:
            return {
                'success': True,
                'output': output
            }
        else:
            return {
                'success': False,
                'error': f'Erro no yt-dlp (código {result.returncode})',
                'output': output
            }
            
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Timeout: O download demorou mais de 5 minutos'
        }
        
    except FileNotFoundError:
        return {
            'success': False,
            'error': 'yt-dlp não encontrado. Certifique-se de que está instalado e no PATH'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }

@app.route('/add-to-queue', methods=['POST'])
def add_to_queue():
    """Adiciona um vídeo à fila de downloads"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados JSON inválidos'
            }), 400
        
        video_url = data.get('video_url')
        referer_url = data.get('referer_url')
        user_title = data.get('title', '').strip()
        download_type = data.get('download_type', 'video')
        
        if not video_url:
            return jsonify({
                'success': False,
                'error': 'URL do vídeo é obrigatória'
            }), 400
        
        # Validar URLs
        if not is_valid_url(video_url) or (referer_url and not is_valid_url(referer_url)):
            return jsonify({
                'success': False,
                'error': 'URLs fornecidas são inválidas'
            }), 400
        
        # Obter título do vídeo se não fornecido pelo usuário
        if not user_title:
            video_title = get_video_title(video_url, referer_url)
            title = video_title if video_title else 'Vídeo sem título'
        else:
            title = user_title
        
        # Criar item da fila
        download_item = {
            'id': str(uuid.uuid4()),
            'video_url': video_url,
            'referer_url': referer_url,
            'title': title,
            'download_type': download_type,
            'added_at': datetime.now().isoformat(),
            'status': 'queued'
        }
        
        # Adicionar à fila
        with queue_lock:
            download_queue.append(download_item)
        
        return jsonify({
            'success': True,
            'message': 'Vídeo adicionado à fila',
            'queue_position': len(download_queue),
            'item_id': download_item['id']
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@app.route('/download', methods=['POST'])
def download_video():
    """Endpoint para download imediato (compatibilidade)"""
    return add_to_queue()

def is_valid_url(url):
    """Valida se a URL é válida"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

@app.route('/queue-status')
def get_queue_status():
    """Retorna o status da fila de downloads"""
    with queue_lock:
        return jsonify({
            'success': True,
            'queue': download_queue,
            'queue_length': len(download_queue),
            'is_processing': queue_status['is_processing'],
            'current_download': queue_status['current_download'],
            'completed': queue_status['completed'][-10:],  # Últimos 10
            'failed': queue_status['failed'][-10:]  # Últimos 10
        })

@app.route('/remove-from-queue/<item_id>', methods=['DELETE'])
def remove_from_queue(item_id):
    """Remove um item da fila"""
    with queue_lock:
        for i, item in enumerate(download_queue):
            if item['id'] == item_id:
                removed_item = download_queue.pop(i)
                return jsonify({
                    'success': True,
                    'message': 'Item removido da fila',
                    'removed_item': removed_item
                })
    
    return jsonify({
        'success': False,
        'error': 'Item não encontrado na fila'
    }), 404

@app.route('/clear-queue', methods=['POST'])
def clear_queue():
    """Limpa a fila de downloads"""
    with queue_lock:
        cleared_count = len(download_queue)
        download_queue.clear()
    
    return jsonify({
        'success': True,
        'message': f'{cleared_count} itens removidos da fila'
    })

@app.route('/downloads')
def list_downloads():
    """Lista os arquivos baixados"""
    try:
        files = []
        if os.path.exists(DOWNLOAD_DIR):
            for filename in os.listdir(DOWNLOAD_DIR):
                filepath = os.path.join(DOWNLOAD_DIR, filename)
                if os.path.isfile(filepath):
                    files.append({
                        'name': filename,
                        'size': os.path.getsize(filepath),
                        'modified': os.path.getmtime(filepath)
                    })
        
        return jsonify({
            'success': True,
            'files': files
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Iniciar thread de processamento da fila
    queue_thread = threading.Thread(target=process_download_queue, daemon=True)
    queue_thread.start()
    
    print(f"Servidor iniciado!")
    print(f"Acesse: http://localhost:8000")
    print(f"Downloads serão salvos em: {DOWNLOAD_DIR}")
    print(f"Sistema de fila ativado!")
    app.run(debug=True, host='0.0.0.0', port=8000)