FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Copy dependency manifests first for better Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create required runtime directories
RUN mkdir -p .test-artifacts/.auth .test-artifacts/.features-gen allure/results playwright-report test-results reports/screenshots

# Pre-generate BDD specs
RUN npx bddgen

# Default: run all tests
CMD ["npx", "playwright", "test"]
