function addPatient() {
  const patientName = document.getElementById("patientName").value;
  const patientDiagnosis = document.getElementById("patientDiagnosis").value;

  if (patientName && patientDiagnosis) {
    // Implementează logica de adăugare a pacientului în baza de date sau sistem

    // Afiseaza un mesaj de succes
    alert(`Pacientul ${patientName} a fost adăugat cu succes!\nDiagnostic: ${patientDiagnosis}`);

    // Poți adăuga și o redirecționare către o altă pagină sau face alte acțiuni necesare
  } else {
    alert("Te rog completează toate câmpurile.");
  }
}
