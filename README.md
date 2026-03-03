# Os Menos Menos v3 🎙️

Plataforma de videochamada real com visual cyberpunk. Vídeo, áudio, chat e compartilhamento de tela reais via LiveKit.

## Stack
- **Next.js 15** · **React 19** · **Tailwind CSS v4** · **Framer Motion** · **LiveKit**

## Configuração do LiveKit (obrigatório)

1. Crie uma conta grátis em [cloud.livekit.io](https://cloud.livekit.io)
2. Crie um novo projeto
3. Copie as credenciais: **API Key**, **API Secret** e **WebSocket URL**
4. Crie um arquivo `.env.local` na raiz do projeto:

```
LIVEKIT_API_KEY=sua_api_key
LIVEKIT_API_SECRET=seu_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://seu-projeto.livekit.cloud
```

## Rodando localmente
```bash
npm install
npm run dev
```

## Deploy no Render
1. Suba no GitHub e conecte ao [render.com](https://render.com)
2. No painel do Render, adicione as 3 variáveis de ambiente do LiveKit
3. Clique em Deploy 🚀
