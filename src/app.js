import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import render from './render.js';
import parse from './parser.js';

const allOrigin = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

export default () => {
  const defaultLng = 'ru';
  //i18next init
  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLng,
    debug: true,
    resources,
  });

  const validateSchema = (validLinks) => {
    yup.setLocale({
      string: {
        url: { key: 'url' },
      },
      mixed: {
        notOneOf: { key: 'notOneOf' },
      },
    });
    
    return yup.string().url().notOneOf(validLinks);
  };

//model
  const state = {
    validLinks: [],
    form: {
      valid: true,
      error: null,
      state: 'filling',
    },
    data: {
      feedList: [],
      postList: [],
    },
    shownLinksId: [],
  };

  const elements = {
    form: document.querySelector('form'),
    submitButton: document.querySelector('button[type="submit"]'),
    rssInput: document.querySelector('#url-input'),
    feedback: document.querySelector('p.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
  };

//viev
  const watchedState = onChange(state, render(elements, state, i18Instance));

//controller
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputData = formData.get('url').trim();
    validateSchema(state.validLinks).validate(inputData)
      .then((link) => {
        state.form.valid = true;
        state.validLinks.push(inputData);
        state.form.error = null;
        return link;
      })
      .then((validLink) => {
        watchedState.form.state = 'sending';
        return axios.get(allOrigin(validLink));
      })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`networkError ${response.status}`);
        }
        const data = parse(response.data.contents);
        if (!data) {
          throw new Error('ParseError');
        }
        const { title, description, items } = data;
        state.data.feedList.unshift({ title, description });
        state.data.postList.unshift(...items);
        watchedState.form.state = 'sent';
      })
      .catch((error) => {
        switch (error.name) {
          case 'ValidationError':
            state.form.valid = false;
            state.form.error = i18Instance.t(error.message.key);
            watchedState.form.state = `error ${error.message.key}`;
            break;
          case 'Error':
            state.validLinks.pop();
            state.form.error = i18Instance.t(error.message);
            watchedState.form.state = `error ${error.message}`;
            break;
          case 'AxiosError':
            state.form.error = i18Instance.t(error.name);
            watchedState.form.state = `error ${error.name}`;
            break;
        }
      });
  });

  const updateData = (links) => {
    const posts = links.map((link) => 
      axios.get(allOrigin(link))
        .then((response) => {
          const data = parse(response.data.contents);
          if (!data) {
            throw new Error('ParseError');
          }
          return data.items;
        })
        .catch(() => ([])));
    
    const promise = Promise.all(posts)
      .then((arr) => arr.flatMap((posts) => posts))
      .then((posts) => {
        const oldPostsTitles = state.data.postList.map((post) => post.title);
        const newPosts = posts.filter((post) => !oldPostsTitles.includes(post.title));
        if (newPosts.length) {
          state.data.postList.unshift(...newPosts);
          watchedState.form.state = 'update';
        }
      })
      .then(() => {
        setTimeout(() => {
          state.form.state = 'filling';
          return updateData(links);
        }, 5000);
      });
  };

  updateData(state.validLinks);
};