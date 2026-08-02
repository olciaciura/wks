export default function Checkbox(props: { label: string }) {
   return (
      <label className="checkbox-row" htmlFor={props.label}>
         <input className="checkbox-row__input" type="checkbox" name="agree" id={props.label} />
         <span className="checkbox-row__label">{props.label}</span>
      </label>
   );
}
