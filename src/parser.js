export default (stringXML) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(stringXML, 'application/xml');
  const errorNode = data.querySelector('parsererror');
  if (errorNode) {
    return false;
  }
  const title = data.querySelector('title').textContent;
  const description = data.querySelector('description').textContent;
  const itemsXML = data.querySelectorAll('item');
  const items = [];
  itemsXML.forEach((itemXML) => {
    const itemTitle = itemXML.children[0].textContent;
    const link = itemXML.children[2].textContent;
    const itemDescription = itemXML.children[3].textContent;
    const pubDate = itemXML.children[4].textContent;

    items.push({
      title: itemTitle,
      link,
      description: itemDescription,
      pubDate,
    });
  });

  return { title, description, items };
};
