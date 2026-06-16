# Asia Trip Price Finder PWA

App PWA installabile sul cellulare senza Play Store. Cerca prezzi reali via Amadeus Flight Offers API.

## Setup rapido
1. Crea account su Amadeus for Developers.
2. Crea una app e copia `AMADEUS_CLIENT_ID` e `AMADEUS_CLIENT_SECRET`.
3. Installa Node.js.
4. In questa cartella:
   ```bash
   npm install
   netlify dev
   ```
5. Apri l'URL locale e testa.

## Deploy telefono
- Carica il progetto su GitHub.
- Collegalo a Netlify.
- In Netlify > Site configuration > Environment variables aggiungi:
  - `AMADEUS_CLIENT_ID`
  - `AMADEUS_CLIENT_SECRET`
  - `AMADEUS_BASE_URL=https://test.api.amadeus.com` per test, oppure produzione quando approvato.
- Apri il sito da smartphone > Aggiungi a schermata Home.

## Alert prezzo
La funzione `check-alerts` è già predisposta ma serve aggiungere un database per salvare le rotte e un canale notifiche:
- Telegram Bot API: semplice e gratis.
- Email con Resend/SendGrid.
- Supabase per salvare soglie e risultati.

## Note
- Amadeus test API non sempre restituisce tutte le combinazioni reali. Per metasearch più ricco valuta Skyscanner Partner API o Kiwi/Tequila.
- Non mettere mai le chiavi API nel frontend: devono stare nelle Netlify Functions.
