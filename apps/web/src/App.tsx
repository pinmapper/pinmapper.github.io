import { BrowserRouter, Route, Routes } from 'react-router'
import { Editor } from '@/pages/Editor'
import { Home } from '@/pages/Home'
import { NewMap } from '@/pages/NewMap'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewMap />} />
        <Route path="/map/:id" element={<Editor />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
