document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const inputs = form.querySelectorAll('input');
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');

  editBtn.addEventListener('click', () => {
    inputs.forEach(input => input.disabled = false);
    editBtn.hidden = true;
    saveBtn.hidden = false;
    inputs[0].focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    console.log('Profile Saved:', {
      name: form.name.value,
      email: form.email.value,
      interests: form.interests.value
    });

    inputs.forEach(input => input.disabled = true);
    editBtn.hidden = false;
    saveBtn.hidden = true;
  });
});
