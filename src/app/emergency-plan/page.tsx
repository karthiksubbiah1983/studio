
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function EmergencyPlanPage() {
  return (
    <div className="p-4 md:p-8 bg-background">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Premier Inn</h1>
            <h2 className="text-xl font-semibold">Bulk LPG Storage Emergency Action Plan</h2>
          </div>

          {/* Site Information Table */}
          <div className="border rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 border-b md:border-b-0 md:border-r font-semibold">Site Name:</div>
              <div className="p-2 border-b md:border-b-0">The Foxburrow</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 border-b md:border-b-0 md:border-r font-semibold">Address:</div>
              <div className="p-2 border-b md:border-b-0">249 Yarmouth Road<br/>Lowestoft<br/>N/A</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 border-b md:border-b-0 md:border-r font-semibold">Postcode:</div>
              <div className="p-2 border-b md:border-b-0">NR32 4AA</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 md:border-r font-semibold">Location of tank(s):</div>
              <div className="p-2">TO THE RIGHT OF THE BUILDING, BESIDE BIN STORAGE</div>
            </div>
          </div>
          
           {/* LPG Volume Table */}
          <div className="border rounded-lg mb-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 md:border-r font-semibold flex items-center">Tanks:</div>
              <div className="grid grid-cols-3 sm:grid-cols-9 text-center">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border-l">
                    <div className="p-1 border-b font-medium">No. {i + 1}</div>
                    <div className="p-1 h-8"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
               <div className="p-2 md:border-r font-semibold flex items-center border-t">Total volume of LPG:</div>
               <div className="grid grid-cols-3 sm:grid-cols-9 text-center border-t">
                  <div className="p-1 border-l">2000</div>
                  <div className="p-1 border-l">2000</div>
                  <div className="p-1 border-l">2000</div>
                  {[...Array(6)].map((_, i) => <div key={i} className="p-1 border-l"></div>)}
               </div>
            </div>
          </div>
          
           {/* Key/Manager Info */}
          <div className="border rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 border-b md:border-b-0 md:border-r font-semibold">The keys for the LPG compound are kept:</div>
              <div className="p-2 border-b md:border-b-0">Office</div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="p-2 border-b md:border-b-0 md:border-r font-semibold">General Manager:</div>
              <div className="p-2 border-b md:border-b-0">Kacie Moss</div>
            </div>
            <div className="p-2 text-sm text-muted-foreground">
                The General Manager is responsible for providing all Team Members with appropriate information in order to ensure this Bulk LPG Storage Emergency Action Plan can be successfully implemented.
            </div>
          </div>

          {/* Potential Hazards */}
          <Card className="mb-6">
            <CardHeader className="bg-muted p-2 rounded-t-lg">
              <CardTitle className="text-base text-center">LPG - Potential Hazards</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>LPG is a colourless liquid which readily evaporates into a gas.</li>
                <li>When mixed with air, the gas can burn or explode when it meets a potential ignition source.</li>
                <li>LPG is heavier than air, so it tends to sink to the ground where it can flow long distances and collect in drains, gullies or cellars.</li>
                <li>The liquid can cause cold burns.</li>
              </ul>
            </CardContent>
          </Card>
          
           {/* Gas Leak Actions */}
          <Card className="mb-6">
            <CardHeader className="bg-muted p-2 rounded-t-lg">
              <CardTitle className="text-base text-center">Action to take in the event of a Gas Leak or Suspected Gas Leak</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm">
                <p className="mb-2">Any person who smells gas or discovers a gas leak should:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Extinguish all sources of ignition.</li>
                <li>Turn off gas appliances.</li>
                <li>Not turn on or off any electrical equipment.</li>
                <li>Shut the emergency control valve(s) outside the building, located at: <span className="font-semibold p-1 border rounded bg-gray-100">Kitchen</span></li>
                <li>Shut all cylinder valve(s) (if safe to do so).</li>
                <li>Ring the Calor Emergency service number on 03457 444 999.</li>
                <li>Not operate electrical equipment.</li>
              </ul>
            </CardContent>
          </Card>

            {/* Fire Actions */}
            <Card>
                <CardHeader className="bg-muted p-2 rounded-t-lg">
                    <CardTitle className="text-base text-center">Action to take in the event of a Fire</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                    <p className="mb-2">In the event of a fire, the following action should be taken:</p>
                     <ul className="list-disc pl-5 space-y-1">
                        <li>Raise the fire alarm.</li>
                        <li>Call the Fire & Rescue Service and make them aware of the presence of the LPG tank(s).</li>
                        <li>Shut all valves on the tank(s) and emergency control valve(s) outside the building (if safe to do so).</li>
                        <li>If the fire is a small one, and Team Members are not putting themselves at risk, Team Members may tackle the fire using the dry powder fire extinguishers.</li>
                        <li>Ring the Calor Emergency service number on 03457 444 999.</li>
                    </ul>
                </CardContent>
            </Card>

        </CardContent>
      </Card>
    </div>
  );
}
