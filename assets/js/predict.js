const input = document.getElementById("inputText");
const btn = document.getElementById("predictBtn");
const spinner = document.getElementById("spinner");
const resultEl = document.getElementById("predictionResult");

const API_URL = "/api/predict-category";

function showSpinner(on=true){ spinner.style.display = on ? "block" : "none" }

// Prefill textarea from URL `text` param (e.g. from detail page)
try{
  const params = new URLSearchParams(window.location.search);
  const pre = params.get('text');
  if (pre && input) {
    input.value = pre;
    input.focus();
    input.setSelectionRange(pre.length, pre.length);
  }
}catch(e){ /* ignore malformed url */ }

async function predict(text){
  try{
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ text })
    });

    const json = await res.json();
    return { ok: res.ok, body: json };
  }catch(e){
    return { ok:false, body: { error: e.message } };
  }
}

btn.addEventListener("click", async () => {
  const text = input.value.trim();
  resultEl.textContent = "";
  if (!text) {
    resultEl.textContent = "Please enter some text to predict.";
    return;
  }

  btn.disabled = true; showSpinner(true);
  const { ok, body } = await predict(text);
  showSpinner(false); btn.disabled = false;

  if (!ok) {
    resultEl.textContent = `Error: ${body?.error || JSON.stringify(body)}`;
    return;
  }

  if (body.predicted_category) {
    resultEl.textContent = `Predicted category: ${body.predicted_category}`;
  } else if (body.error) {
    resultEl.textContent = `Error: ${body.error}`;
  } else {
    resultEl.textContent = `Unexpected response: ${JSON.stringify(body)}`;
  }
});

// Optional: allow Ctrl+Enter to submit
input.addEventListener('keydown', (e)=>{
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') btn.click();
});
