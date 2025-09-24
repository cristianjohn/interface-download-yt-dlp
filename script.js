document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('downloadForm');
    const statusDiv = document.getElementById('status');
    const outputDiv = document.getElementById('output');
    const downloadBtn = document.getElementById('downloadBtn');
    const addToQueueKeepBtn = document.getElementById('addToQueueKeepBtn');
    const addToQueueClearBtn = document.getElementById('addToQueueClearBtn');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    
    // Elementos da fila
    const queueStatusDiv = document.getElementById('queueStatus');
    const processingStatusSpan = document.getElementById('processingStatus');
    const queueLengthSpan = document.getElementById('queueLength');
    const currentDownloadDiv = document.getElementById('currentDownload');
    const queueListDiv = document.getElementById('queueList');
    const completedListDiv = document.getElementById('completedList');
    
    let statusUpdateInterval;
    
    // Função para obter dados do formulário
    function getFormData() {
        const videoUrl = document.getElementById('videoUrl').value;
        const refererUrl = document.getElementById('refererUrl').value;
        const title = document.getElementById('title').value;
        const downloadType = document.getElementById('downloadType').value;
        
        if (!videoUrl) {
            alert('Por favor, insira a URL do vídeo.');
            return null;
        }
        
        return {
            video_url: videoUrl,
            referer_url: refererUrl || null,
            title: title || 'Sem título',
            download_type: downloadType
        };
    }
    
    // Download direto (comportamento original)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = getFormData();
        if (!formData) return;
        
        // Desabilitar o botão e mostrar status
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Baixando...';
        statusDiv.innerHTML = '<div class="status-item processing">🔄 Iniciando download...</div>';
        outputDiv.innerHTML = '';
        
        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                statusDiv.innerHTML = '<div class="status-item success">✅ Download concluído com sucesso!</div>';
                outputDiv.innerHTML = `<pre>${result.output}</pre>`;
                
                // Limpar o formulário
                form.reset();
            } else {
                statusDiv.innerHTML = '<div class="status-item error">❌ Erro no download</div>';
                outputDiv.innerHTML = `<pre class="error">${result.error}</pre>`;
            }
        } catch (error) {
            statusDiv.innerHTML = '<div class="status-item error">❌ Erro de conexão</div>';
            outputDiv.innerHTML = `<pre class="error">Erro: ${error.message}</pre>`;
        } finally {
            // Reabilitar o botão
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Baixar Vídeo';
        }
    });
    
    // Função auxiliar para adicionar à fila
    async function addToQueue(clearFields = false, buttonElement, originalText) {
        const formData = getFormData();
        if (!formData) return;
        
        buttonElement.disabled = true;
        buttonElement.textContent = 'Adicionando...';
        
        try {
            const response = await fetch('/add-to-queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                statusDiv.innerHTML = '<div class="status-item success">✅ Adicionado à fila!</div>';
                if (clearFields) {
                    form.reset();
                }
                updateQueueStatus();
            } else {
                statusDiv.innerHTML = '<div class="status-item error">❌ Erro ao adicionar à fila</div>';
                outputDiv.innerHTML = `<pre class="error">${result.error}</pre>`;
            }
        } catch (error) {
            statusDiv.innerHTML = '<div class="status-item error">❌ Erro de conexão</div>';
            outputDiv.innerHTML = `<pre class="error">Erro: ${error.message}</pre>`;
        } finally {
            buttonElement.disabled = false;
            buttonElement.textContent = originalText;
        }
    }
    
    // Adicionar à fila mantendo os campos
    addToQueueKeepBtn.addEventListener('click', async function() {
        await addToQueue(false, addToQueueKeepBtn, 'Adicionar à Fila (Manter Campos)');
    });
    
    // Adicionar à fila limpando os campos
    addToQueueClearBtn.addEventListener('click', async function() {
        await addToQueue(true, addToQueueClearBtn, 'Adicionar à Fila (Limpar Campos)');
    });
    
    // Limpar fila
    clearQueueBtn.addEventListener('click', async function() {
        if (!confirm('Tem certeza que deseja limpar toda a fila?')) {
            return;
        }
        
        clearQueueBtn.disabled = true;
        clearQueueBtn.textContent = 'Limpando...';
        
        try {
            const response = await fetch('/clear-queue', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                statusDiv.innerHTML = '<div class="status-item success">✅ Fila limpa!</div>';
                updateQueueStatus();
            } else {
                statusDiv.innerHTML = '<div class="status-item error">❌ Erro ao limpar fila</div>';
            }
        } catch (error) {
            statusDiv.innerHTML = '<div class="status-item error">❌ Erro de conexão</div>';
        } finally {
            clearQueueBtn.disabled = false;
            clearQueueBtn.textContent = 'Limpar Fila';
        }
    });
    
    // Atualizar status da fila
    async function updateQueueStatus() {
        try {
            const response = await fetch('/queue-status');
            const data = await response.json();
            
            // Atualizar contador da fila
            const queueCount = data.queue_length || 0;
            const completedCount = data.completed ? data.completed.length : 0;
            queueLengthSpan.textContent = `${queueCount} itens na fila • ${completedCount} concluídos`;
            
            // Atualizar status de processamento
            processingStatusSpan.className = `processing-status ${data.is_processing ? 'active' : 'idle'}`;
            processingStatusSpan.textContent = data.is_processing ? 'Processando' : 'Inativo';
            
            // Atualizar download atual
            if (data.current_download) {
                currentDownloadDiv.innerHTML = createDownloadItemHTML(data.current_download, true);
                currentDownloadDiv.style.display = 'block';
            } else {
                currentDownloadDiv.style.display = 'none';
            }
            
            // Atualizar fila
            queueListDiv.innerHTML = '';
            if (data.queue && Array.isArray(data.queue)) {
                data.queue.forEach(item => {
                    queueListDiv.appendChild(createDownloadItemElement(item, false));
                });
            }
            
            // Atualizar downloads concluídos
            completedListDiv.innerHTML = '';
            if (data.completed && Array.isArray(data.completed)) {
                data.completed.forEach(item => {
                    completedListDiv.appendChild(createDownloadItemElement(item, false, true));
                });
            }
            
            // Mostrar/ocultar seção da fila
            queueStatusDiv.style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao atualizar status da fila:', error);
        }
    }
    
    // Criar elemento HTML para item de download
    function createDownloadItemElement(item, isCurrent = false, isCompleted = false) {
        const div = document.createElement('div');
        div.className = `download-item ${isCurrent ? 'current' : ''} ${item.status === 'completed' ? 'completed' : ''} ${item.status === 'failed' ? 'failed' : ''}`;
        div.innerHTML = createDownloadItemHTML(item, isCurrent, isCompleted);
        return div;
    }
    
    // Criar HTML para item de download
    function createDownloadItemHTML(item, isCurrent = false, isCompleted = false) {
        const statusBadge = `<span class="status-badge ${item.status}">${getStatusText(item.status)}</span>`;
        const typeBadge = `<span class="type-badge ${item.download_type || 'video'}">${getTypeText(item.download_type || 'video')}</span>`;
        const progressBar = isCurrent && item.status === 'processing' ? 
            '<div class="progress-bar"><div class="progress-fill"></div></div>' : '';
        
        const removeButton = !isCurrent && !isCompleted ? 
            `<button class="btn-small btn-secondary" onclick="removeFromQueue('${item.id}')">Remover</button>` : '';
        
        return `
            <div class="download-info">
                <div class="download-title">${item.title}</div>
                <div class="download-url">${item.video_url}</div>
                ${progressBar}
            </div>
            <div class="download-actions">
                ${typeBadge}
                ${statusBadge}
                ${removeButton}
            </div>
        `;
    }
    
    // Obter texto do status
    function getStatusText(status) {
        const statusMap = {
            'queued': 'Na Fila',
            'processing': 'Processando',
            'completed': 'Concluído',
            'failed': 'Falhou'
        };
        return statusMap[status] || status;
    }
    
    // Obter texto do tipo de download
    function getTypeText(type) {
        const typeMap = {
            'video': 'MP4',
            'audio': 'MP3'
        };
        return typeMap[type] || type;
    }
    
    // Remover item da fila
    window.removeFromQueue = async function(itemId) {
        try {
            const response = await fetch(`/remove-from-queue/${itemId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                updateQueueStatus();
            } else {
                alert('Erro ao remover item da fila');
            }
        } catch (error) {
            alert('Erro de conexão ao remover item');
        }
    };
    
    // Inicializar e atualizar status periodicamente
    updateQueueStatus();
    statusUpdateInterval = setInterval(updateQueueStatus, 2000);
    
    // Limpar intervalo quando a página for fechada
    window.addEventListener('beforeunload', function() {
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
        }
    });
});