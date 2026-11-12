import * as Icons from "@/components/icons";
const icons = [
  ["menu", Icons.MenuIcon],
  ["close", Icons.CloseIcon],
  ["back", Icons.BackIcon],
  ["chevron-left", Icons.ChevronLeftIcon],
  ["chevron-right", Icons.ChevronRightIcon],
  ["chevron-down", Icons.ChevronDownIcon],
  ["search", Icons.SearchIcon],
  ["settings", Icons.SettingsIcon],
  ["sign-out", Icons.SignOutIcon],
  ["filter", Icons.FilterIcon],
  ["view-list", Icons.ViewListIcon],
  ["view-timeline", Icons.ViewTimelineIcon],
  ["requests-board", Icons.RequestsBoardIcon],
  ["add", Icons.AddIcon],
  ["remove", Icons.RemoveIcon],
  ["play", Icons.PlayIcon],
  ["pause", Icons.PauseIcon],
  ["check", Icons.CheckIcon],
  ["clear", Icons.ClearIcon],
  ["reset-demo", Icons.ResetDemoIcon],
  ["repeat-issue", Icons.RepeatIssueIcon],
  ["last-week", Icons.LastWeekIcon],
  ["time-limit", Icons.TimeLimitIcon],
  ["assign", Icons.AssignIcon],
  ["guest-view", Icons.GuestViewIcon],
  ["dictate", Icons.DictateIcon],
  ["status-open", Icons.StatusOpenIcon],
  ["status-closed", Icons.StatusClosedIcon],
  ["status-overdue", Icons.StatusOverdueIcon],
  ["status-received", Icons.StatusReceivedIcon],
  ["logged-by-desk", Icons.LoggedByDeskIcon],
  ["language", Icons.LanguageIcon],
  ["translated", Icons.TranslatedIcon],
  ["log-request", Icons.LogRequestIcon],
  ["dept-maintenance", Icons.DeptMaintenanceIcon],
  ["dept-housekeeping", Icons.DeptHousekeepingIcon],
  ["dept-front-desk", Icons.DeptFrontDeskIcon],
  ["towels", Icons.TowelsIcon],
  ["pillows", Icons.PillowsIcon],
  ["room-cleaning", Icons.RoomCleaningIcon],
  ["shower-water", Icons.ShowerWaterIcon],
  ["heating-ac", Icons.HeatingAcIcon],
  ["tv-wifi", Icons.TvWifiIcon],
  ["something-broken", Icons.SomethingBrokenIcon],
  ["late-checkout", Icons.LateCheckoutIcon],
  ["taxi", Icons.TaxiIcon],
  ["room-door", Icons.RoomDoorIcon],
  ["rating", Icons.RatingIcon],
] as const;
const hotelIcons = [
  ["Maintenance", Icons.DeptMaintenanceIcon],
  ["Housekeeping", Icons.DeptHousekeepingIcon],
  ["Front desk", Icons.DeptFrontDeskIcon],
  ["Towels", Icons.TowelsIcon],
  ["Pillows", Icons.PillowsIcon],
  ["Cleaning", Icons.RoomCleaningIcon],
  ["Shower / water", Icons.ShowerWaterIcon],
  ["Heating / AC", Icons.HeatingAcIcon],
  ["TV / Wi-Fi", Icons.TvWifiIcon],
  ["Something broken", Icons.SomethingBrokenIcon],
  ["Late checkout", Icons.LateCheckoutIcon],
  ["Taxi", Icons.TaxiIcon],
] as const;
export default function IconsPage() {
 return <main className="group p-8"><h1 className="mb-6 text-2xl font-semibold">Mews Guest Requests · Icons</h1>
 <label className="mb-6 flex items-center gap-2 text-sm"><input type="checkbox" /> Hide icon labels for recognition check</label>
 {["var(--background)", "var(--mews-grey)", "var(--mews-orchid-tint)"].map(bg => <section key={bg} style={{background:bg}} className="mb-8 rounded-md border p-6"><h2 className="mb-4 text-sm">{bg}</h2><div className="grid grid-cols-2 gap-6 md:grid-cols-5 lg:grid-cols-7">{icons.map(([name, Icon]) => <div key={name}><div className="flex h-8 items-center gap-4">{[16,20,24].map(size => <Icon key={size} className="shrink-0" style={{width:size,height:size}} />)}</div><p className="mt-2 text-xs group-has-checked:invisible">{name}</p></div>)}</div></section>)}
 <section className="mb-8 rounded-md border bg-muted p-6">
   <h2 className="mb-4 text-sm font-medium">Hotel icons · preset tiles · 24px</h2>
   <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
     {hotelIcons.map(([label, Icon]) => <div key={label} className="flex flex-col items-start gap-1.5 rounded-md border bg-background p-2.5 text-left text-sm"><Icon className="size-6 text-muted-foreground" /><span className="group-has-checked:invisible">{label}</span></div>)}
   </div>
 </section>
 <section className="flex flex-wrap gap-8">{[Icons.ReceivedArt, Icons.AssignedArt, Icons.OnTheWayArt, Icons.FixedArt, Icons.ConfirmedArt].map((Art, i) => <figure key={i}><Art title={["Received", "Assigned", "On the way", "Fixed", "Confirmed"][i]} /><figcaption>{["Received", "Assigned", "On the way", "Fixed", "Confirmed"][i]}</figcaption></figure>)}<figure><Icons.RatingIcon strokeWidth={0.65} className="size-[120px]" /><Icons.RatingIcon strokeWidth={0.65} className="size-[120px] fill-orchid text-orchid" /><figcaption>Rate · empty / filled</figcaption></figure></section>
 </main>;
}
