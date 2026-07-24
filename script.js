document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  note.textContent = 'Thanks! This is a demo form — hook it up to your email or booking service to go live.';
  form.reset();
});
