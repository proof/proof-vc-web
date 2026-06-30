import { init, transactionData, type ProofVerifyId } from "../src";

/* Demo credentials for local development — a sandbox client on the `next`
   environment. `clientId` is not a secret (it travels in the authorization
   URL); callbackUri matches the dev server's default port. */
init({
  environment: "next",
  clientId: "caxdw5a7d",
  callbackUri: "http://localhost:8000",
});

/* Feed structured transaction data to the `#tx-demo` element. */
const txDemo = document.querySelector<ProofVerifyId>("#tx-demo");
if (txDemo) {
  txDemo.transactionData = transactionData.paymentMandate({
    payment_instrument: { type: "card", id: "pm_demo" },
    payee: { name: "Acme" },
    prompt_summary: "Authorize $42.00 to Acme",
    amount: 42,
    currency: "USD",
  });
}
