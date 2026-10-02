export function createLoginScreen() {
  const element = document.createElement('section');
  element.className = 'login-screen';
  element.innerHTML = `
    <div class="login-story">
      <a class="brand login-brand" href="#top"><span class="brand-mark" aria-hidden="true">d</span><span>daymark</span></a>
      <div class="login-story-content">
        <p class="login-eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
        <h1>A calmer place<br>to get it done.</h1>
        <p class="login-story-copy">Bring your plans into focus, one thoughtful step at a time.</p>
        <div class="login-preview" aria-hidden="true">
          <div class="preview-heading"><span>Today, at your pace</span><span>03</span></div>
          <div class="preview-task"><span class="preview-check is-checked">✓</span><span>Make a little room</span><span class="preview-tag tag-mint">DONE</span></div>
          <div class="preview-task"><span class="preview-check"></span><span>Choose what matters</span><span class="preview-tag tag-yellow">NEXT</span></div>
          <div class="preview-task"><span class="preview-check"></span><span>Take it one step at a time</span><span class="preview-tag tag-coral">LATER</span></div>
        </div>
      </div>
      <p class="login-story-footer">A little more clarity, every day.</p>
    </div>
    <div class="login-panel">
      <div class="login-form-wrap">
        <p class="login-kicker">YOUR WORKSPACE</p>
        <h2>Welcome back.</h2>
        <p class="login-intro">Sign in to pick up where you left off.</p>
        <form class="login-form" id="login-form">
          <label class="login-field" for="login-email">Email address
            <input id="login-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
          </label>
          <label class="login-field" for="login-password">Password
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required>
          </label>
          <button class="primary-button login-submit" type="submit">Enter daymark <span aria-hidden="true">→</span></button>
        </form>
        <p class="login-footnote">Your projects and tasks stay saved in this browser.</p>
      </div>
      <p class="login-panel-footer">DAYMARK <span aria-hidden="true">·</span> A CLEARER KIND OF TO-DO LIST</p>
    </div>`;

  return {
    element,
    form: element.querySelector('#login-form'),
    email: element.querySelector('#login-email'),
    password: element.querySelector('#login-password'),
  };
}
