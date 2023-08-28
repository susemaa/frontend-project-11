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
  setUniqueIds(items);

  return { title, description, items };
};
