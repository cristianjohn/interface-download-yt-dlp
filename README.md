# YT-DLP Video Downloader Interface

Uma interface web simples para executar o comando `yt-dlp` com parâmetros personalizados.

## Funcionalidades

### Interface Principal
- Interface web intuitiva para executar o yt-dlp
- Campos para URL do vídeo, URL referer e título opcional
- Validação de URLs
- Feedback visual do status do download
- Exibição da saída do comando yt-dlp
- Downloads salvos em diretório organizado
- Tratamento de erros e timeouts

### Sistema de Fila de Downloads
- **Fila de Downloads**: Adicione múltiplos vídeos para download sequencial
- **Download Direto**: Baixe um vídeo imediatamente (comportamento original)
- **Monitoramento em Tempo Real**: Acompanhe o status da fila e downloads em andamento
- **Gerenciamento da Fila**: Remova itens específicos ou limpe toda a fila
- **Histórico**: Visualize downloads concluídos e com falha
- **Processamento Automático**: A fila processa automaticamente os downloads em sequência

## Pré-requisitos

1. **Python 3.7+**
2. **yt-dlp** instalado globalmente:
   ```bash
   pip3 install yt-dlp
   ```
   ou
   ```bash
   brew install yt-dlp
   ```

## Instalação

1. Clone ou baixe este repositório
2. Navegue até o diretório do projeto:
   ```bash
   cd internal-download-yt-dlp
   ```

3. Instale as dependências Python:
   ```bash
   pip3 install -r requirements.txt
   ```

## Como usar

1. **Inicie o servidor:**
   ```bash
   python3 app.py
   ```

2. **Acesse a interface:**
   Abra seu navegador e vá para: `http://localhost:8000`

### Download Direto
1. Acesse `http://localhost:8000` no seu navegador
2. Insira a URL do vídeo que deseja baixar
3. Insira a URL referer (se necessário)
4. Adicione um título opcional para identificar o download
5. Clique em "Baixar Vídeo" para download imediato
6. Aguarde o download ser concluído
7. Os arquivos serão salvos no diretório `downloads/`

### Sistema de Fila
1. **Adicionar à Fila**: 
   - Preencha os campos (URL do vídeo, referer, título)
   - Clique em "Adicionar à Fila"
   - O item será adicionado à fila de downloads

2. **Monitorar Downloads**:
   - A seção "Status da Fila" mostra informações em tempo real
   - Veja quantos itens estão na fila e quantos foram concluídos
   - Acompanhe o download atual em andamento

3. **Gerenciar Fila**:
   - **Remover Item**: Clique em "Remover" ao lado de qualquer item na fila
   - **Limpar Fila**: Use o botão "Limpar Fila" para remover todos os itens pendentes

4. **Histórico**:
   - Visualize downloads concluídos com sucesso
   - Veja downloads que falharam para tentar novamente

### Recursos Adicionais
- **Processamento Automático**: A fila processa downloads automaticamente, um por vez
- **Atualizações em Tempo Real**: A interface atualiza automaticamente a cada 2 segundos
- **Títulos Personalizados**: Adicione títulos para identificar facilmente seus downloads

## Estrutura do Projeto

```
internal-download-yt-dlp/
├── app.py              # Servidor Flask principal
├── index.html          # Interface web
├── style.css           # Estilos da interface
├── script.js           # JavaScript da interface
├── requirements.txt    # Dependências Python
├── README.md          # Este arquivo
└── downloads/         # Pasta onde os vídeos são salvos (criada automaticamente)
```

## Comando executado

A aplicação executa o seguinte comando yt-dlp:

```bash
yt-dlp -f "bv*+ba/b" \
  --referer "url_link_referer" \
  --merge-output-format mp4 \
  "url_link_video"
```

## Recursos

- **Validação de URLs**: Verifica se as URLs fornecidas são válidas
- **Timeout**: Limite de 5 minutos por download
- **Feedback visual**: Status em tempo real do processo
- **Logs detalhados**: Saída completa do yt-dlp
- **Organização**: Downloads salvos na pasta `downloads/`

## Solução de Problemas

### Erro: "yt-dlp não encontrado"
- Certifique-se de que o yt-dlp está instalado:
  ```bash
  yt-dlp --version
  ```
- Se não estiver instalado:
  ```bash
  pip3 install yt-dlp
  ```

### Erro de permissão
- Certifique-se de que o diretório tem permissões de escrita
- Execute com sudo se necessário (não recomendado)

### Timeout
- Alguns vídeos podem demorar mais de 5 minutos
- Você pode ajustar o timeout no arquivo `app.py` (linha com `timeout=300`)

## Segurança

- A aplicação valida URLs antes de executar comandos
- Não executa comandos arbitrários do usuário
- Timeout para evitar processos infinitos
- Logs detalhados para debugging

## Licença

Este projeto é de uso livre para fins educacionais e pessoais.