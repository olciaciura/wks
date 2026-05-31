import Checkbox from "../components/CHeckbox";
import CompetitionInfo from "../components/CompetitionInfo";
import TransportInput from "../components/TransportInput";

export default function CompetitionForm() {
   return (
      <div>
         <h1>Competition</h1>
         <CompetitionInfo></CompetitionInfo>
         <Checkbox label="bieg1"></Checkbox>
         <Checkbox label="bieg2"></Checkbox>
         <TransportInput></TransportInput>
      </div>
   );
}
