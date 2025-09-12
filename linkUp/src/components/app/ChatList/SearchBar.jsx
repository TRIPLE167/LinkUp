 

import { FaSearch } from "react-icons/fa";
import "./SearchBar.scss";

export default function SearchBar({ onSearch }) {
  return (
    <div className="search-bar">
      <div>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => onSearch(e.target.value)}
        />
        <div>
          <FaSearch className="icon" color="" />
        </div>
      </div>
    </div>
  );
}
