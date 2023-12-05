let accounts = [];
let doctorAccounts = [];
let patientAccounts = [];

function createAccount() {
  const accountType = document.getElementById('accountType').value;
  const name = document.getElementById('doctorName').value;
  const specialization = document.getElementById('specialization').value;

  if (name && (specialization || accountType === 'patient')) {
    const newAccount = {
      type: accountType,
      name: name,
      specialization: specialization
    };

    if (accountType === 'doctor') {
      doctorAccounts.push(newAccount);
    } else {
      patientAccounts.push(newAccount);
    }

    updateAccountList();
    updateAppointmentStats(); 
    updateDiagnosesStats(); 
  } else {
    alert('Please fill in all fields.');
  }
}

function updateAppointmentStats() {
  document.getElementById('lastMonthAppointments').textContent = '5'; 
  document.getElementById('lastYearAppointments').textContent = '50'; 
}

function updateDiagnosesStats() {
  document.getElementById('lastMonthDiagnoses').textContent = '10'; 
  document.getElementById('lastYearDiagnoses').textContent = '100'; 
}


function viewDoctorAccounts() {
  alert(JSON.stringify(doctorAccounts, null, 2));
}

function viewPatientAccounts() {
  alert(JSON.stringify(patientAccounts, null, 2));
}

function createDoctorAccount() {
  document.getElementById('accountType').value = 'doctor';
  toggleForm();
}

function updateAppointmentStats() {

  document.getElementById('alergologieLastMonth').textContent = '2';
  document.getElementById('alergologieLastYear').textContent = '20';

  document.getElementById('alergologieLastMonth').textContent = '5';
  document.getElementById('alergologieLastYear').textContent = '40';

  document.getElementById('boliInfectioaseLastMonth').textContent = '10';
  document.getElementById('boliInfectioaseLastYear').textContent = '110';

  document.getElementById('chirurgieGeneralaLastMonth').textContent = '15';
  document.getElementById('chirurgieGeneralaLastYear').textContent = '150';

  document.getElementById('diabetLastMonth').textContent = '3';
  document.getElementById('diabetLastYear').textContent = '70';

  document.getElementById('endocrinologieLastMonth').textContent = '4';
  document.getElementById('endocrinologieLastYear').textContent = '60';

  document.getElementById('gastroenterologieLastMonth').textContent = '7';
  document.getElementById('gastroenterologieLastYear').textContent = '35';

  document.getElementById('psihiatrieLastMonth').textContent = '8';
  document.getElementById('psihiatrieLastYear').textContent = '75';

}

/*document.getElementById("nana").onclick = function(){
  location.href = 'view-doctor-accounts.html'
}*/
