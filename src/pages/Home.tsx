import { useAuth } from "../context/AuthContext"
import Calendar from "../components/Calendar"
import "../styles/Home.css"

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="home">
      <h1>Welcome to Grill Rent, {user?.name}!</h1>
      <section className="grill-list">
        <h2>Available Grills</h2>
        <ul>
          <li>Large Gas Grill - $50/day</li>
          <li>Charcoal Smoker - $40/day</li>
          <li>Portable Electric Grill - $30/day</li>
        </ul>
      </section>
      <section className="booking">
        <h2>Book a Grill</h2>
        <Calendar />
      </section>
    </div>
  )
}

export default Home

