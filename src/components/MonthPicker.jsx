const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const START_YEAR = 2007;

export default function MonthPicker(props) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const years = [];
  for (let y = currentYear; y >= START_YEAR; y--) {
    years.push(y);
  }

  return (
    <div class="header-nav">
      <select
        value={props.month}
        onChange={(e) => props.onMonthChange(parseInt(e.target.value))}
      >
        {MONTHS.map((name, i) => (
          <option value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={props.year}
        onChange={(e) => props.onYearChange(parseInt(e.target.value))}
      >
        {years.map((y) => (
          <option value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
