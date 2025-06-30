#!/bin/bash

# Script de inicialização para YT-DLP Interface

echo "=== YT-DLP Video Downloader Interface ==="
echo

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale o Python 3."
    exit 1
fi

# Verificar se yt-dlp está instalado
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp não encontrado."
    echo "📦 Instalando yt-dlp..."
    pip3 install yt-dlp
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao instalar yt-dlp. Tente instalar manualmente:"
        echo "   pip3 install yt-dlp"
        exit 1
    fi
fi

# Verificar se as dependências estão instaladas
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

echo "📦 Instalando dependências..."
venv/bin/pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Falha ao instalar dependências."
    exit 1
fi

# Criar diretório de downloads
mkdir -p downloads

echo
echo "✅ Configuração concluída!"
echo "🚀 Iniciando servidor..."
echo
echo "📱 Acesse: http://localhost:8000"
echo "📁 Downloads serão salvos em: $(pwd)/downloads"
echo
echo "Para parar o servidor, pressione Ctrl+C"
echo

# Iniciar o servidor
venv/bin/python app.py