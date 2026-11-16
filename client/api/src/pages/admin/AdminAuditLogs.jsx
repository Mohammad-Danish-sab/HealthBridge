import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { FileClock, Search, RefreshCw, Filter } from "lucide-react";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs(200);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = ["ALL", ...new Set(logs.map((l) => l.action))];

  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      selectedAction === "ALL" || log.action === selectedAction;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details &&
        log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action) => {
    if (action.includes("CREATE") || action.includes("PLACE"))
      return "bg-emerald-100 text-emerald-800";
    if (action.includes("UPDATE") || action.includes("TOGGLE"))
      return "bg-blue-100 text-blue-800";
    if (action.includes("DELETE") || action.includes("CANCEL"))
      return "bg-red-100 text-red-800";
    return "bg-purple-100 text-purple-800";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileClock className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              System Activity & Audit Logs
            </h1>
            <p className="text-sm text-gray-500">
              Immutable record of administrative and platform events
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search details, entity type, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white font-semibold text-gray-700"
          >
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act === "ALL" ? "All Event Types" : act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500">
          No audit log entries found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Target Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Actor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${getActionBadgeColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                      {log.entity_type}{" "}
                      {log.entity_id ? `#${log.entity_id}` : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {log.user_id ? `User #${log.user_id}` : "System"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
