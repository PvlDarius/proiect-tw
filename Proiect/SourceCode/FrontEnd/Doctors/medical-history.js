function viewMedicalHistory() {
  const patientName = document.getElementById("patientNameHistory").value;
  // Implementarea logicii pentru a obține istoricul medical al pacientului
  const medicalHistory = "Diagnostic1, Diagnostic2, Diagnostic3"; // Exemplu de istoric medical
  document.getElementById("medicalHistoryResult").innerText = "Istoric Medical: " + medicalHistory;
}
