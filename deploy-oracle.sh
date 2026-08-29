#!/bin/bash
# =============================================================================
# Script de desplegament per Oracle Cloud Free Tier - Colla Gegantera
# =============================================================================
# Executa aquest script a la VM d'Oracle Cloud despres de connectar-te per SSH.
# Els secrets NO viuen al repositori: es generen o es demanen durant la
# configuracio, i nomes es guarden al fitxer .env (gitignored) de la VM.
# =============================================================================

set -e

echo "=== COLL GEGANTERA - DESPLEGAMENT ==="
echo ""

# 1. Actualitzar sistema
echo "[1/8] Actualitzant sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instal.lar Docker
echo "[2/8] Instal.lant Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
fi
echo "Docker instal.lat: $(docker --version)"

# 3. Instal.lar Docker Compose
echo "[3/8] Instal.lant Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt install -y docker-compose-plugin
fi

# 4. Crear directori de treball
echo "[4/8] Creant directori de treball..."
mkdir -p /home/"$USER"/colla-gegantera
cd /home/"$USER"/colla-gegantera

# 5. Clonar o copiar projecte
echo "[5/8] Configurant projecte..."
echo "NOTA: Has de copiar o clonar el projecte a /home/$USER/colla-gegantera/"
echo "      (per exemple: git clone https://github.com/Pol-821/collagegantera.git)"

# 6. Configurar .env amb secrets externs
echo "[6/8] Configurant variables d'entorn..."
if [ ! -f .env ]; then
    # JWT key aleatoria
    JWT_KEY=$(openssl rand -base64 32 | tr -d '=+/' | head -c 32)

    # VAPID keys: genera-les a la teva maquina local amb:
    #   npx web-push generate-vapid-keys
    # i enganxa'ls aqui (no es poden generar amb openssl).
    cat > .env << EOF
JWT_KEY=${JWT_KEY}

# Colla (registre d'usuaris)
COLLA_CODE=

# SMTP (Gmail). SMTP_PASSWORD = password d'aplicacio de Gmail (NO la teva contrasenya).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SENDER_NAME=Colla Gegantera

# Web Push / VAPID
#   A la teva maquina local: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:colla@gegantera.app
EOF
    echo "Arxiu .env creat. ABANS de continuar, omple a ma:"
    echo "  - COLLA_CODE"
    echo "  - SMTP_USERNAME (remitent, ex. notificacions@domini.cat)"
    echo "  - SMTP_PASSWORD (password d'aplicacio de Gmail)"
    echo "  - VAPID_PUBLIC_KEY i VAPID_PRIVATE_KEY (npx web-push generate-vapid-keys)"
    echo ""
    read -r -p "Quan ho hagis omplert, prem [Enter] per continuar..." _continue
fi

# 7. Construir i executar
echo "[7/8] Construint i executant Docker..."
sudo docker compose up -d --build

# 8. Configurar firewall
echo "[8/8] Configurant firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 5000/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "Firewall configurat."
fi

echo ""
echo "=== DESPLEGAMENT COMPLETAT ==="
echo "API disponible a: http://$(curl -s ifconfig.me):5000"
echo "Swagger UI: http://$(curl -s ifconfig.me):5000/swagger"
echo ""
echo "PROPERS PASSOS:"
echo "1. Configurar Cloudflare DNS per al frontend"
echo "2. Desplegar el frontend a Cloudflare Pages (VITE_API_URL=https://api-el-teu-domini.cat)"
echo "3. Verificar que els secrets de .env no es committin mai (el repositori te .gitignore)"
echo ""