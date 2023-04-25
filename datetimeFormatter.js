export default function datetimenow() {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const datetimenow =
    day + "" + month + "" + year + "" + hours + "" + minutes + "" + seconds;
  return datetimenow;
}
