export const HOW_TO_USE_PORTAL = {
  title: "How this screen works",
  body: "You are helping a customer. The top half of the screen is the company's computer system. The bottom half is the chat. Ask the customer for the details you need, type them into the system, then tell the customer what you found and what you did.",
  tips: [
    "The customer will not tell you everything at once. Ask follow-up questions.",
    "Some buttons are not the right next step. If you see an error, try a different action.",
    "When a step says to return to the customer, switch back to the chat and talk to them before clicking further.",
  ],
};

export const workflowTutorials = {
  flight_cancellation: {
    title: "Flight Cancellation",
    situation:
      "A passenger's flight was cancelled because of weather. Your job is to find their booking, offer a new flight, apply what the airline can actually give them, and explain it clearly.",
    steps: [
      "Ask for their booking reference or last name, then search for them in the system.",
      "Read why the flight was cancelled. Weather cancellations have different rules than airline-caused ones.",
      "Go back to chat and ask whether they want the earliest flight today or a direct flight tomorrow morning. Then select the flight they choose.",
      "Read the compensation rules. For weather, the airline does not have to pay for a hotel or cash. A small meal voucher is allowed.",
      "Confirm the new flight and issue the meal voucher. Do not issue a hotel voucher.",
      "In chat, tell them the new flight times, that their paid seat class carries over, that a hotel is not covered, and that the meal voucher was sent. Mention lounge access if they qualify, and confirm their return flight is still intact.",
    ],
  },

  baggage_delay: {
    title: "Lost Baggage",
    situation:
      "A passenger's checked bag has been missing for two days. Your job is to look up the claim, see where the bag was last seen, help with short-term expenses, and give a clear update.",
    steps: [
      "Ask for their bag claim number or bag tag number, then search for the claim.",
      "Read the bag details, then check the tracking status.",
      "Note the last scan location and the estimated find time. If the bag has medication, mark the file as a medical priority.",
      "Read what the airline will reimburse. Everyday clothes and toiletries are covered up to a daily limit. Prescription medicine is covered if they keep the receipt. Electronics are not.",
      "Confirm the medical priority flag and send the reimbursement form.",
      "In chat, share the tracking update, the 24–72 hour estimate, that the file is flagged for medication, and that they can buy emergency medicine and everyday items and submit receipts.",
    ],
  },

  book_flight: {
    title: "Book Flight",
    situation:
      "A customer wants you to book a new flight. Your job is to learn what they need, pick a matching flight and seat, add extras they asked for, then confirm the price and booking.",
    steps: [
      "Ask for their name or customer ID, then pull up their profile.",
      "Ask when they want to travel, whether they need a nonstop flight, and what time they must arrive. Then choose a flight that matches.",
      "Ask what kind of seat they want (for example, aisle) and select it on the seat map. Do not skip this or assign a random seat.",
      "Add extras they asked for, such as a checked bag or Wi-Fi. A carry-on is already included.",
      "Go back to chat and walk through the total price and the refund or change rules before you book.",
      "Confirm the details in the system, then in chat give them the flight times, seat, extras, total price, and confirmation number.",
    ],
  },

  package_never_arrived: {
    title: "Package Never Arrived",
    situation:
      "A customer says their package never showed up, even though tracking may say it was delivered. Your job is to look up the order, check the delivery record, start an investigation, and send a replacement or refund.",
    steps: [
      "Ask for their customer ID or order number, then search for the account.",
      "Review what was ordered, the total, and the shipping address.",
      "Read the tracking timeline. If it says delivered but the customer never got it, do not close the case.",
      "Look at the GPS and driver notes, then submit a lost-package investigation. The investigation can run in the background — you do not have to wait to help them.",
      "Choose a resolution that fits their situation. If they need the item soon and they are a premium member, an expedited replacement is usually the best option.",
      "Confirm the replacement or refund in the system, then in chat explain what you did, when the new package should arrive, and give them the case numbers.",
    ],
  },

  exchange_item: {
    title: "Exchange Item",
    situation:
      "A customer wants to swap a recent purchase for a different size. Your job is to confirm they can exchange it, find the new size in stock, choose how it will ship, and complete the swap.",
    steps: [
      "Ask for their customer ID or order number, then search for the order.",
      "Review the item, size, color, and whether they are still inside the return window.",
      "Confirm the item is unused and still eligible to exchange.",
      "Ask what size they need, then select a size that is in stock.",
      "Choose the shipping option that fits their timing. Premium members can often get overnight shipping at no extra charge.",
      "Complete the exchange, then in chat confirm the new size, when it will arrive, that a free return label was sent for the original item, and give them the confirmation numbers.",
    ],
  },

  refund_request: {
    title: "Refund Request",
    situation:
      "A customer received a product that does not work and wants their money back. Your job is to find the order, confirm a refund is allowed, process it, and explain when the money will return.",
    steps: [
      "Ask for their order number or the product name, then search for the order.",
      "Read what is wrong with the item and whether a return is already in progress.",
      "Confirm the item qualifies for a refund (for example, it arrived defective).",
      "Read the refund rules. A defective item usually gets a full refund to the original payment method, not store credit only.",
      "Review the refund details, write a short case note about what you did, then confirm the refund.",
      "In chat, tell them the refund amount, that it goes back to the original card, how many days it should take, and that a prepaid return label was emailed.",
    ],
  },

  loan_delay: {
    title: "Loan Delay",
    situation:
      "A customer applied for a loan and has been waiting longer than they were told. Your job is to look up the application, find out why it is delayed, and give a specific update — not a vague “it’s processing.”",
    steps: [
      "Ask for their loan ID or customer ID, then search for the application.",
      "Read the current status and how long it has been delayed.",
      "Note the reason for the delay. If the missing documents are already in, do not ask for them again.",
      "Read the processing rules. For a delayed file that is already in final review, confirm the decision time and add a priority note. Do not deny the loan or escalate unless the decision date is unknown.",
      "Write a short case note with the status and expected decision time, then confirm the update.",
      "In chat, tell them the documents were received, the application is in final review, the expected decision time, and that a priority note was added so they will be notified.",
    ],
  },
};

export function getWorkflowTutorial(scenario) {
  return workflowTutorials[scenario] ?? null;
}
