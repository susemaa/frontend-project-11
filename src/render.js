import i18next from "i18next";

const handlePreviewButton = (title, description, state) =>(e) => {
  const titleContainer = document.querySelector('.modal-title');
  titleContainer.textContent = title;
  const descriptionContainer = document.querySelector('.modal-body');
  descriptionContainer.textContent = description;

  const id = e.target.dataset.id;
  const link = document.querySelector(`[data-id="${id}"]`);
  if (link.classList.contains('fw-bold')) {
    state.shownLinksId.push(id);
    link.classList.add('fw-normal', 'link-secondary');
    link.classList.remove('fw-bold');
  }
  const href = link.getAttribute('href');
  const readFullButton = document.querySelector('a.full-article');
  readFullButton.setAttribute('href', href);
};

const hanldeLink = (state) => (e) => {
  if (e.target.classList.contains('fw-bold')) {
    state.shownLinksId.push(e.target.dataset.id);
    e.target.classList.add('fw-normal', 'link-secondary');
    e.target.classList.remove('fw-bold');
  }
};

const renderError = ({ rssInput, feedback, submitButton }, state, i18Instance) => {
  if (!state.form.valid) {
    rssInput.classList.add('is-invalid');
  }
  if (feedback.classList.contains('text-success')) {
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success');
  }
  const errorMessage = i18Instance.t(state.form.error);
  feedback.textContent = errorMessage;
  submitButton.classList.remove('disabled');
};

const renderSending = ({ feedback, submitButton }) => {
  feedback.textContent = '';
  submitButton.classList.add('disabled');
};

const createTitleContainer = (type, i18Instance) => {
  const title = document.createElement('h2');
  title.classList.add('card-title', 'h4');
  title.textContent = i18Instance.t(`${type}sTitle`);
  const titleContainer = document.createElement('div');
  titleContainer.classList.add('card-body');
  titleContainer.append(title);
  return titleContainer;
};

const createUlContainer = (titleContainer, list) => {
  const ulContainer = document.createElement('div');
  ulContainer.classList.add('card', 'border-0');
  ulContainer.append(titleContainer);
  ulContainer.append(list);
  return ulContainer;
};

const renderFeeds = ({ feeds }, state, i18Instance) => {
  feeds.innerHTML = '';

  const titleContainer = createTitleContainer('feed', i18Instance);

  const feedList = document.createElement('ul');
  feedList.classList.add('list-group', 'border-0', 'rounded-0');
  state.data.feedList.map(({ title, description }) => {
    const titleElement = document.createElement('h3');
    titleElement.classList.add('h6', 'm-0');
    titleElement.textContent = title;
    
    const descriptionElement = document.createElement('p');
    descriptionElement.classList.add('m-0', 'small', 'text-black-50');
    descriptionElement.textContent = description;

    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'border-0', 'border-end-0');
    liElement.append(titleElement);
    liElement.append(descriptionElement);
    return liElement;
  })
    .forEach((feedElement) => {
      feedList.append(feedElement);
    });

  const feedsContainer = createUlContainer(titleContainer, feedList);
  feeds.append(feedsContainer);
};

const renderPosts = ({ posts }, state, i18Instance) => {
  posts.innerHTML = '';

  const titleContainer = createTitleContainer('post', i18Instance);

  const postList = document.createElement('ul');
  postList.classList.add('list-group', 'border-0', 'rounded-0');
  state.data.postList.map(({ title, link, description, id}) => {
    const aElement = document.createElement('a');
    aElement.classList.add('fw-bold');
    if (state.shownLinksId.includes(id)) {
      aElement.classList.add('fw-normal', 'link-secondary');
      aElement.classList.remove('fw-bold');
    }
    aElement.setAttribute('href', link);
    aElement.setAttribute('data-id', id);
    aElement.setAttribute('target', '_blank');
    aElement.setAttribute('rel', 'noopener noreferrer');
    aElement.textContent = title;
    aElement.addEventListener('click', hanldeLink(state));

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18Instance.t('previewButton');
    button.addEventListener('click', handlePreviewButton(title, description, state));

    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    liElement.append(aElement);
    liElement.append(button);
    return liElement;
  })
    .forEach((post) => {
      postList.append(post);
    });

  const postsContainer = createUlContainer(titleContainer, postList);
  posts.append(postsContainer);
};

const renderSent = (elements, state, i18Instance) => {
  const { form, rssInput, feedback, submitButton } = elements;
  renderFeeds(elements, state, i18Instance);
  renderPosts(elements, state, i18Instance);
  if (feedback.classList.contains('text-danger')) {
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger');
  }
  if (rssInput.classList.contains('is-invalid')) {
    rssInput.classList.remove('is-invalid');
  }
  submitButton.classList.remove('disabled');
  feedback.textContent = i18Instance.t('success');
  form.reset();
  rssInput.focus();
};

export default (elements, state, i18Instance) => (path, value, previousValue) => {
  switch (value) {
    case ('sending') :
      renderSending(elements);
      break;
    case ('sent') :
      renderSent(elements, state, i18Instance);
      break;
    case ('update') :
      renderPosts(elements, state, i18Instance);
      break;
    case value.match(/^error/)?.input : //value starts with error
      renderError(elements, state, i18Instance);
      break;
  }
};
