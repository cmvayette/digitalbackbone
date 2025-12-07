import './App.css'
import { PolicyEditor } from './components/PolicyEditor'

function App() {
  return (
    <>
      <div className="app-container">
        <header className="app-header">
          <h1>Policy & Governance</h1>
          <p>Author and Govern Policies</p>
        </header>
        <main>
          <PolicyEditor />
        </main>
      </div>
    </>
  )
}

export default App
