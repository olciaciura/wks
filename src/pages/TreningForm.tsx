import TransportInput from "../components/TransportInput";
import TreningInfo from "../components/TreningInfo";

export default function TreningForm() {
   return (
      <div>
         <h1>Trening</h1>
         <TreningInfo></TreningInfo>
         <select name="Trasa">
            <option value="1">Opcja 1</option>
            <option value="2">Opcja 2</option>
            <option value="3">Opcja 3</option>
         </select>
         <TransportInput></TransportInput>
         <input type="text" />
         <button type="submit">Zatwierdź</button>
      </div>
   );
}
