export default (stringXML) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(stringXML, 'application/xml');
  const title = data.querySelector('title').textContent;
  const description = data.querySelector('description').textContent;
  const itemsXML = data.querySelectorAll('item');
  const items = [];
  itemsXML.forEach((itemXML) => {
    const title = itemXML.children[0].textContent;
    const link = itemXML.children[2].textContent;
    const description = itemXML.children[3].textContent;
    const pubDate = itemXML.children[4].textContent;
    
    items.push({ title, link, description, pubDate });
  });
  return { title, description, items };
};
