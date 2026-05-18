# Kubernetes Runbook

## What Kubernetes Does

Kubernetes runs and manages containers.

Docker builds images. Kubernetes runs those images as pods and keeps the desired number of pods alive.

## Local Cluster

This project uses Docker Desktop Kubernetes.

Check cluster:

```bash
kubectl cluster-info
kubectl get nodes

cd backend/product-service
docker build -t orderflow-product-service:local .

cd ../order-service
docker build -t orderflow-order-service:local .

cd ../notification-worker
docker build -t orderflow-notification-worker:local .

cd ../scheduler
docker build -t orderflow-scheduler:local .

cd ../../frontend
docker build -t orderflow-frontend:local .

kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/product-service.yaml
kubectl apply -f infra/kubernetes/order-service.yaml
kubectl apply -f infra/kubernetes/workers.yaml
kubectl apply -f infra/kubernetes/frontend.yaml
kubectl apply -f infra/kubernetes/nginx-gateway-config.yaml
kubectl apply -f infra/kubernetes/nginx-gateway.yaml

kubectl port-forward -n orderflow service/nginx-gateway 8088:8080


kubectl logs -n orderflow deployment/product-service
kubectl logs -n orderflow deployment/order-service-api
kubectl logs -n orderflow deployment/order-service-worker
kubectl logs -n orderflow deployment/notification-worker
kubectl logs -n orderflow deployment/scheduler
kubectl logs -n orderflow deployment/frontend
kubectl logs -n orderflow deployment/nginx-gateway