import { NavLink } from 'react-router-dom'
export function AccountingNav(){return <nav className="accounting-tabs" aria-label="Accounting tools"><NavLink to="/accounting/journal">Money journal</NavLink><NavLink to="/accounting/break-even">Break-even calculator</NavLink><NavLink to="/accounting/budgets">Budget check</NavLink></nav>}
