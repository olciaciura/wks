export default function Checkbox(props: { label: string }) {
   return (
      <label htmlFor={props.label}>
         <input type="checkbox" name="agree" id={props.label} />
         {props.label}
      </label>
   );
}
