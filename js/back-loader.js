// Keep the decoded original PNG alive before replacing the visible deck.
const readyBacks = new Map();

export function prepareBack(back) {
  const url = new URL(back.url, document.baseURI).href;
  if (!readyBacks.has(url)) {
    const image = new Image();
    const ready = new Promise((resolve, reject) => {
      image.onload = async () => {
        try {
          if (image.decode) await image.decode();
          resolve(image);
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error('Card back could not be loaded'));
      image.src = url;
    }).catch(error => {
      readyBacks.delete(url);
      throw error;
    });
    readyBacks.set(url, ready);
  }
  return readyBacks.get(url);
}
