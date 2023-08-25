import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import render from './render.js';
import parse from './parser.js';

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
    }
  };

  const elements = {
    form: document.querySelector('form'),
    submitButton: document.querySelector('button[type="submit"]'),
    rssInput: document.querySelector('#url-input'),
    feedback: document.querySelector('p.feedback'),
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
        console.log(response);
        if (response.status !== 200) {
          throw new Erorr(`networkError ${response.status}`);
        }
        const data = parse(response.data.contents);
        if (!data) {
          throw new Erorr('parseErorr');
        }
        const { title, description, items } = data;
        console.log(title, description, items);
      })
      .catch((error) => {
        switch (error.name) {
          case 'ValidationError':
            console.log('valid error', error.message.key);
            state.form.valid = false;
            state.form.error = i18Instance.t(error.message.key);
            watchedState.form.state = `error ${error.message.key}`;
            break;
        }
        //watchedState.form.state = 'error';
      });
  });
};