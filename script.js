const $=id=>document.getElementById(id);
const money=n=>"₹"+Number(n).toLocaleString("en-IN");
const today=new Date().toISOString().split("T")[0];

function renderCars(){
  const q=($("searchInput").value||"").toLowerCase().trim();
  const cat=$("categoryFilter").value, fuel=$("fuelFilter").value, price=$("priceFilter").value;
  const filtered=cars.filter(c=>{
    const matchesQ=!q||`${c.name} ${c.category} ${c.fuel}`.toLowerCase().includes(q);
    const matchesCat=cat==="all"||c.category===cat;
    const matchesFuel=fuel==="all"||c.fuel===fuel;
    const matchesPrice=price==="all"||(price==="low"&&c.price<2500)||(price==="mid"&&c.price>=2500&&c.price<=4000)||(price==="high"&&c.price>4000);
    return matchesQ&&matchesCat&&matchesFuel&&matchesPrice;
  });
  $("carGrid").innerHTML=filtered.map(c=>`
    <article class="car-card">
      <div class="car-img" style="background-image:url('${c.image}')"></div>
      <div class="car-body">
        <div class="car-top"><h3>${c.name}</h3><span class="badge">${c.status}</span></div>
        <div class="car-meta"><span>⛽ ${c.fuel}</span><span>👤 ${c.seats} seats</span><span>▣ ${c.category}</span></div>
        <div class="car-bottom"><div class="price"><strong>${money(c.price)}</strong><small>/day</small></div>
          <div class="card-actions"><button class="small-btn" onclick="showDetails(${c.id})">Details</button><button class="small-btn primary" onclick="selectCar(${c.id})">Book</button></div>
        </div>
      </div>
    </article>`).join("");
  $("emptyState").hidden=filtered.length!==0;
}
function populateSelect(){
  $("carSelect").innerHTML='<option value="">Select a car</option>'+cars.map(c=>`<option value="${c.id}">${c.name} — ${money(c.price)}/day</option>`).join("");
}
function selectCar(id){$("carSelect").value=id;document.querySelector("#booking").scrollIntoView({behavior:"smooth"});updateEstimate();}
function showDetails(id){
  const c=cars.find(x=>x.id===id);
  $("modalContent").innerHTML=`<div class="modal-img" style="background-image:url('${c.image}')"></div><p class="eyebrow">${c.category.toUpperCase()}</p><h2>${c.name}</h2><p style="color:#6d7682;margin:8px 0 18px">${c.description}</p><div class="car-meta"><span>⛽ ${c.fuel}</span><span>👤 ${c.seats} seats</span><span>✓ ${c.status}</span></div><h3>${money(c.price)} <small>/day</small></h3><br><button class="btn primary" onclick="closeModal();selectCar(${c.id})">Book this car</button>`;
  $("carModal").classList.add("show");$("carModal").setAttribute("aria-hidden","false");
}
function closeModal(){$("carModal").classList.remove("show");$("carModal").setAttribute("aria-hidden","true")}
function datesValid(){
  const p=$("pickupDate").value,r=$("returnDate").value;
  if(!p||!r)return false;
  return new Date(r)>=new Date(p);
}
function updateEstimate(){
  const car=cars.find(c=>c.id===$("carSelect").value),p=$("pickupDate").value,r=$("returnDate").value;
  if(!car||!p||!r||!datesValid()){$("durationText").textContent="—";$("totalText").textContent="₹0";return}
  const days=Math.max(1,Math.ceil((new Date(r)-new Date(p))/86400000)+1);
  $("durationText").textContent=`${days} day${days>1?"s":""}`;$("totalText").textContent=money(days*car.price);
}
function setError(input,msg){const group=input.closest(".form-group");group.querySelector(".error").textContent=msg}
function validate(){
  let ok=true;
  const name=$("fullName"),email=$("email"),phone=$("phone"),car=$("carSelect"),p=$("pickupDate"),r=$("returnDate");
  [name,email,phone,car,p,r].forEach(x=>setError(x,""));
  if(name.value.trim().length<3){setError(name,"Please enter your full name.");ok=false}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)){setError(email,"Enter a valid email.");ok=false}
  if(!/^\d{10}$/.test(phone.value.trim())){setError(phone,"Enter a valid 10-digit phone number.");ok=false}
  if(!car.value){setError(car,"Please select a car.");ok=false}
  if(!p.value||p.value<today){setError(p,"Choose today or a future date.");ok=false}
  if(!r.value||!p.value||new Date(r.value)<new Date(p.value)){setError(r,"Return date must be on/after pickup date.");ok=false}
  return ok;
}
function getBookings(){return JSON.parse(localStorage.getItem("driveeaseBookings")||"[]")}
function saveBooking(b){localStorage.setItem("driveeaseBookings",JSON.stringify([b,...getBookings()]))}
function renderHistory(){
  const list=getBookings();
  if(!list.length){$("bookingHistory").innerHTML='<div class="history-empty">No bookings yet. Your confirmed bookings will appear here.</div>';return}
  $("bookingHistory").innerHTML=list.map(b=>`<div class="history-item"><div><strong>${b.name}</strong><small>${b.bookingId}</small></div><div><strong>${b.carName}</strong><small>${b.pickup} → ${b.return}</small></div><div><strong>${money(b.total)}</strong><small>${b.days} day${b.days>1?"s":""}</small></div><span class="badge">Confirmed</span></div>`).join("");
}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),3200)}
$("bookingForm").addEventListener("submit",e=>{
  e.preventDefault();if(!validate())return;
  const car=cars.find(c=>c.id===$("carSelect").value);
  const days=Math.max(1,Math.ceil((new Date($("returnDate").value)-new Date($("pickupDate").value))/86400000)+1);
  const booking={bookingId:"DE-"+Date.now().toString().slice(-7),name:$("fullName").value.trim(),email:$("email").value.trim(),phone:$("phone").value.trim(),carId:car.id,carName:car.name,pickup:$("pickupDate").value,return:$("returnDate").value,days,total:days*car.price,notes:$("notes").value.trim()};
  saveBooking(booking);renderHistory();$("bookingForm").reset();$("pickupDate").min=today;$("returnDate").min=today;updateEstimate();
  toast(`Booking ${booking.bookingId} confirmed successfully!`);setTimeout(()=>$("history").scrollIntoView({behavior:"smooth"}),500);
});
["searchInput","categoryFilter","fuelFilter","priceFilter"].forEach(id=>$(id).addEventListener("input",renderCars));
["carSelect","pickupDate","returnDate"].forEach(id=>$(id).addEventListener("change",updateEstimate));
$("clearBookings").addEventListener("click",()=>{if(getBookings().length&&confirm("Clear all booking history?")){localStorage.removeItem("driveeaseBookings");renderHistory();toast("Booking history cleared.")}});
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("driveeaseTheme",document.body.classList.contains("dark")?"dark":"light")});
if(localStorage.getItem("driveeaseTheme")==="dark")document.body.classList.add("dark");
$("menuToggle").addEventListener("click",()=>{$("mainNav").classList.toggle("open")});
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
$("modalClose").addEventListener("click",closeModal);$("carModal").addEventListener("click",e=>{if(e.target===$("carModal"))closeModal()});
$("quickSearchBtn").addEventListener("click",()=>{$("searchInput").value=$("quickLocation").value;renderCars();$("cars").scrollIntoView({behavior:"smooth"})});
$("pickupDate").min=today;$("returnDate").min=today;$("quickPickup").min=today;$("quickReturn").min=today;
$("quickPickup").addEventListener("change",()=>{$("pickupDate").value=$("quickPickup").value;updateEstimate()});
$("quickReturn").addEventListener("change",()=>{$("returnDate").value=$("quickReturn").value;updateEstimate()});
renderCars();populateSelect();renderHistory();