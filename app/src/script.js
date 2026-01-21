document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profile-form');
  const inputs = form.querySelectorAll('input');
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');

  try {
    const response = await fetch('/get-profile');
    if (response.ok) {
      const userData = await response.json();
      form.name.value = userData.name || '';
      form.email.value = userData.email || '';
      form.interests.value = userData.interests || '';
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }

  editBtn.addEventListener('click', () => {
    inputs.forEach(input => input.disabled = false);
    editBtn.hidden = true;
    saveBtn.hidden = false;
    inputs[0].focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          interests: form.interests.value
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile saved successfully:', result);

        inputs.forEach(input => input.disabled = true);
        editBtn.hidden = false;
        saveBtn.hidden = true;
      } else {
        const error = await response.json();
        alert('Error saving profile: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  });
});
