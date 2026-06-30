import ComputerControlDashboard from './devtools/ComputerControlDashboard'

/**
 * Main user-facing Computer Control page.
 * Renders the full ComputerControlDashboard within the user-facing route.
 */
export default function ComputerControl() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ComputerControlDashboard />
    </div>
  )
}
