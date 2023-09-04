import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import render from './render.js';
import parse from './parser.js';

const makeUrlWithProxy = (url) => {
  const baseUrl = 'https://allorigins.hexlet.app';
  const urlWithProxy = new URL(baseUrl);
  urlWithProxy.pathname = '/get';
  urlWithProxy.searchParams.set('disableCache', 'true');
  urlWithProxy.searchParams.set('url', encodeURI(url));

  return urlWithProxy.href;
};

const getUniqueId = () => {
  // always start with a letter (for DOM friendlyness)
  let idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
  do {
    // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
    const ascicode = Math.floor((Math.random() * 42) + 48);
    if (ascicode < 58 || ascicode > 64) {
      // exclude all chars between : (58) and @ (64)
      idstr += String.fromCharCode(ascicode);
    }
  } while (idstr.length < 32);

  return (idstr);
};

const setUniqueIds = (coll) => {
  if (!coll.length) {
    return [];
  }

  coll.forEach((element) => {
    element.id = getUniqueId();
  });
  return coll;
};

export default () => {
  const defaultLng = 'ru';
  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLng,
    debug: true,
    resources,
  })
    .then(() => {
      yup.setLocale({
        string: {
          url: { key: 'url' },
        },
        mixed: {
          notOneOf: { key: 'notOneOf' },
        },
      });
      const validateSchema = (validLinks) => yup.string().url().notOneOf(validLinks);

      // model
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

      // viev
      const watchedState = onChange(state, render(elements, state, i18Instance));

      // controller
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputData = formData.get('url').trim();
        validateSchema(state.validLinks).validate(inputData)
          .then((validLink) => {
            state.form.valid = true;
            state.validLinks.push(inputData);
            state.form.error = null;
            watchedState.form.state = 'sending';
            return axios.get(makeUrlWithProxy(validLink));
          })
          .then((response) => {
            if (response.status !== 200) {
              throw new Error(`networkError ${response.status}`);
            }
            const data = parse(response.data.contents);
            const { title, description, items } = data;
            setUniqueIds(items);
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
              default:
                throw new Error('unkown Error');
            }
          });
      });

      const updateData = (links) => {
        const currentPosts = links.map((link) => axios.get(makeUrlWithProxy(link))
          .then((response) => {
            const data = parse(response.data.contents);
            setUniqueIds(data.items);
            return data.items;
          })
          .catch(() => ([])));

        Promise.all(currentPosts)
          .then((arr) => {
            const posts = arr.flatMap((unflatPosts) => unflatPosts);
            const oldPostsTitles = state.data.postList.map((post) => post.title);
            const newPosts = posts.filter((post) => !oldPostsTitles.includes(post.title));
            if (newPosts.length) {
              state.data.postList.unshift(...newPosts);
              watchedState.form.state = 'update';
            }
          })
          .finally(() => {
            setTimeout(() => {
              state.form.state = 'filling';
              return updateData(links);
            }, 5000);
          });
      };

      updateData(state.validLinks);
    });
};
