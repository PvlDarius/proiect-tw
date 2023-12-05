function modifyPatient() {
  const initialDiagnosis = document.getElementById("initialDiagnosis").value;
  const newDiagnosis = document.getElementById("newDiagnosis").value;

  if (initialDiagnosis && newDiagnosis) {

    alert(`Diagnosticul pacientului a fost modificat cu succes!\nDiagnostic initial: ${initialDiagnosis}\nDiagnostic nou: ${newDiagnosis}`);

  } else {
    alert("Te rog completează toate câmpurile.");
  }
}
