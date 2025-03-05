import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Clock } from "../"
import { useAuth } from "../../context/AuthContext"
import "./Header.css"

const Header = () => {
  const { isAuthenticated, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <header className="header">
      <div className="header-content">
      <h1>Condomínio Chácara Sacopã</h1>
      <Clock />
      {isAuthenticated &&
        <nav>
            <ul>
              <li>
                <Link to="/">{t("Header.Home")}</Link>
              </li>
              <li>
                <Link to="/profile">{t("Header.Profile")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("Header.Contact")}</Link>
              </li>
              <li>
                <button onClick={logout}>{t("Header.Logout")}</button>
              </li>
            </ul>
        </nav>
      }
      </div>
    </header>
  )
}

export default Header

