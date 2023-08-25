const renderError = ({ rssInput, feedback }, errorMessage) => {
  rssInput.classList.add('is-invalid');
  if (feedback.classList.contains('text-success')) {
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success');
  }
  feedback.textContent = errorMessage;
};

const renderSending = ({ feedback, submitButton }) => {
  feedback.textContent = '';
  submitButton.classList.add('disabled');
}

export default (elements, state, i18Instance) => (path, value, previousValue) => {
  switch (value) {
    case ('sending') :
      renderSending(elements);
      if (state.form.valid === true) {
        elements.rssInput.classList.remove('is-invalid');
        elements.feedback.classList.add('text-success');
        elements.feedback.classList.remove('text-danger');
        elements.feedback.textContent = i18Instance.t('success');
        elements.form.reset();
        elements.rssInput.focus();
      }
      break;
    case value.match(/^error/)?.input : //value starts with error
      renderError(elements, i18Instance.t(state.form.error))
      break;
  }
};
