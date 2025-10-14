# Interní backend

# Vývoj

### Instalace

```bash
# otevři si tuto složku, pokud v ní nejsi
cd backend

# nainstaluj závislosti
npm ci

# spusť databázové migrace
npm run migrations:run

# vytvoř administrátorského uživatele
npm run cli create-admin
```

### Spuštění vývojového serveru

```bash
# spusť vývojový server
npm run dev

# nebo z kořenové složky rovnou i s frontendem
cd .. && npm run dev
```
