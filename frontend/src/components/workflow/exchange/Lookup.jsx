import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeLookup({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const { customer, previousOrders, previousExchanges, previousSupportCases, screens } = workflow;
  const searchKeys = screens.lookup.searchKeys || [];

  const query = workflowData.searchQuery;
  const found = workflowData.applicationStatus;
  const notFound = workflowData.searchNotFound;

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
    setSearchedQuery(query);
    const match = searchKeys.some(k => k.trim().toUpperCase() === query.trim().toUpperCase());
    updateData("applicationStatus", match);
    updateData("searchNotFound", !match);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Customer Lookup</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={screens.lookup.searchPlaceholder}
          value={query}
          onChange={e => {
            setSearched(false);
            updateData("searchQuery", e.target.value);
            updateData("searchNotFound", false);
            updateData("applicationStatus", false);
          }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <ActionButton label={screens.lookup.searchButtonLabel} variant="primary" onClick={handleSearch} />
      </div>
      <div className="flex gap-2">
        {screens.lookup.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      {searched && notFound && !found && (
        <div className="border border-red-200 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          No record found for <strong>{searchedQuery}</strong>. Check the customer ID and try again.
        </div>
      )}
      {found && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Customer Record Found
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Customer Name: </span><span className="font-medium text-gray-800">{customer.name}</span></div>
            <div><span className="text-gray-400">Customer ID: </span><span className="font-medium text-gray-800">{customer.customerId}</span></div>
            <div><span className="text-gray-400">Membership Status: </span><span className="font-medium text-gray-800">{customer.membership}</span></div>
            <div><span className="text-gray-400">Contact: </span><span className="font-medium text-gray-800">{customer.phone}</span></div>
          </div>
          <div className="px-4 pb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previous Orders</p>
              <div className="space-y-1.5">
                {previousOrders.map(o => (
                  <div key={o.id} className="text-sm text-gray-700 flex justify-between border border-gray-100 rounded-lg px-2.5 py-1.5 bg-white">
                    <span>{o.item}</span>
                    <span className="text-gray-400">{o.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previous Exchanges</p>
              <div className="space-y-1.5">
                {previousExchanges.map(e => (
                  <div key={e.id} className="text-sm text-gray-700 flex justify-between border border-gray-100 rounded-lg px-2.5 py-1.5 bg-white">
                    <span>{e.item}</span>
                    <span className="text-gray-400">{e.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previous Support Cases</p>
              <div className="space-y-1.5">
                {previousSupportCases.map(c => (
                  <div key={c.id} className="text-sm text-gray-700 flex justify-between border border-gray-100 rounded-lg px-2.5 py-1.5 bg-white">
                    <span>{c.topic}</span>
                    <span className="text-gray-400">{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            <ActionButton label={screens.lookup.advanceLabel} variant="primary" onClick={onAdvance} />
            {screens.lookup.foundWrongButtons.map(label => (
              <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
