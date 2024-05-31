FROM python:3
WORKDIR /app
ARG POETRY_VERSION=1.2.2

# 更新并安装 nodejs
RUN apt-get update && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*  # 正确的清理 apt 缓存命令

# 安装 Poetry
RUN pip3 install --no-cache-dir poetry==${POETRY_VERSION} && \
    rm -rf ~/.cache/pip/

COPY package*.json ./
COPY pyproject.toml ./
COPY poetry.lock ./

# 设置环境变量以跳过 Puppeteer 的 Chromium 下载
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 安装 Python 和 Node.js 依赖
RUN poetry install && \
    npm install && \
    rm -rf ~/.npm/

COPY . .

CMD ["npm", "run", "dev"]
