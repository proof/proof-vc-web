import { init, transactionData, ProofVerifyId } from "../../src/index.ts";

init({
  environment: "next",
  clientId: "caxdw5a7d",
  callbackUri: "http://localhost:4000",
});

const txDemo = document.querySelector<ProofVerifyId>(
  "proof-verify-id[data-tx]",
);
if (txDemo) {
  txDemo.transactionData = transactionData.paymentMandate({
    payment_instrument: { type: "card", id: "pm_demo" },
    payee: { name: "Acme" },
    prompt_summary: "Authorize $42.00 to Acme",
    amount: 42,
    currency: "USD",
  });
}
