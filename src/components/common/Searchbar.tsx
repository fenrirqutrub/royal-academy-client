// src/components/common/SearchBar.tsx
//
// ════════════════════════════════════════════════════════════════
//  Universal SearchBar — সব জায়গায় একই component
// ════════════════════════════════════════════════════════════════
//
//  import SearchBar from "../../components/common/SearchBar";
//
// ────────────────────────────────────────────────────────────────
//  PATTERN A — Local filter (instant, no API)
//  যেমন: Teacher list, Student list, যেকোনো client-side filter
// ────────────────────────────────────────────────────────────────
//
//  const [search, setSearch] = useState("");
//
//  <SearchBar
//    value={search}
//    onChange={setSearch}
//    placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
//  />
//
//  const filtered = list.filter(item => item.name.includes(search));
//
// ────────────────────────────────────────────────────────────────
//  PATTERN B — Debounced API call
//  যেমন: ManagePhotos, Blog search — type করার পর delay দিয়ে API call
// ────────────────────────────────────────────────────────────────
//
//  const [query, setQuery] = useState("");
//
//  <SearchBar
//    value={query}
//    onSearch={setQuery}         ← 400ms পরে fires
//    placeholder="Search photos..."
//  />
//
//  useEffect(() => {
//    fetchFromAPI(query);
//  }, [query]);
//
// ────────────────────────────────────────────────────────────────
//  PATTERN C — একসাথে দুটো (instant local + debounced API)
//  যেমন: real-time UI update + background API call
// ────────────────────────────────────────────────────────────────
//
//  const [search, setSearch] = useState("");
//
//  <SearchBar
//    value={search}
//    onChange={setSearch}          ← instant (UI update)
//    onSearch={(q) => fetchAPI(q)} ← debounced (API call)
//    placeholder="খুঁজুন..."
//  />
//
// ────────────────────────────────────────────────────────────────
//  PATTERN D — Uncontrolled (state ভেতরেই থাকে)
//  যেমন: quick use, parent-এ state লাগবে না
// ────────────────────────────────────────────────────────────────
//
//  <SearchBar
//    onSearch={(q) => console.log(q)}
//    placeholder="Search..."
//  />
//
// ════════════════════════════════════════════════════════════════
//  সব Props:
//
//  value       → controlled value (string) — না দিলে internal state use করে
//  onChange    → প্রতি keystroke-এ instant fire
//  onSearch    → debounce delay পরে fire (default: 400ms)
//  placeholder → input placeholder, default: "Search..."
//  label       → floating label text (focus হলে উপরে উঠে), default: "Search"
//  debounceMs  → debounce delay ms, default: 400
//  className   → wrapper div-এ extra Tailwind class
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { IoSearch, IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";

export interface SearchBarProps {
  value?: string;
  onChange?: (v: string) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  label = "Search",
  debounceMs = 400,
  className = "",
}: SearchBarProps) => {
  // value prop দেওয়া থাকলে controlled, না থাকলে internal state
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(value ?? "");
  const query = isControlled ? value! : internalQuery;

  const [debouncedQuery] = useDebounce(query, debounceMs);
  const [isFocused, setIsFocused] = useState(false);

  // বাইরের value change (e.g. parent reset) sync করো
  const prevValue = useRef(value);
  useEffect(() => {
    if (isControlled && value !== prevValue.current) {
      prevValue.current = value;
      setInternalQuery(value!);
    }
  }, [value, isControlled]);

  // debounce শেষে onSearch fire
  const isFirstRender = useRef(true);
  useEffect(() => {
    // first render-এ onSearch fire করবো না
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onSearch) onSearch(debouncedQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!isControlled) setInternalQuery(v);
    if (onChange) onChange(v);
  };

  const handleClear = () => {
    if (!isControlled) setInternalQuery("");
    setIsFocused(false);
    if (onChange) onChange("");
    // clear হলে onSearch-কে instant empty দাও — debounce wait না করে
    if (onSearch) onSearch("");
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 20px rgba(16,185,129,0.35)"
              : "0 1px 4px rgba(0,0,0,0.08)",
          }}
          transition={{ duration: 0.25 }}
          className={`relative flex items-center rounded-xl overflow-hidden border transition-colors duration-200 bg-[var(--color-bg)] ${
            isFocused
              ? "border-emerald-400 dark:border-emerald-500"
              : "border-[var(--color-active-border)]"
          }`}
        >
          {/* search icon */}
          <div className="absolute left-4 pointer-events-none text-emerald-500 dark:text-emerald-400">
            <IoSearch className="w-5 h-5" />
          </div>

          {/* input */}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full h-12 pl-12 pr-12 text-sm bg-transparent text-[var(--color-text)] placeholder-[var(--color-gray)] outline-none bangla"
          />

          {/* clear button */}
          <AnimatePresence>
            {query && (
              <motion.button
                key="clear"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                type="button"
                className="absolute right-3 p-1.5 rounded-full bg-[var(--color-bg)] cursor-pointer"
              >
                <IoClose className="w-3.5 h-3.5 text-[var(--color-gray)]" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* floating label */}
        <AnimatePresence>
          {(isFocused || query) && (
            <motion.div
              key="label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-2.5 left-4 px-1.5 text-xs font-medium rounded bg-[var(--color-bg)] text-emerald-600 dark:text-emerald-400 pointer-events-none"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "খুঁজছে..." status — শুধু onSearch থাকলে দেখায় */}
      <AnimatePresence>
        {onSearch && debouncedQuery && (
          <motion.p
            key="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2 text-xs text-[var(--color-gray)] pl-1"
          >
            <span className="bangla">খুঁজছে: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              &quot;{debouncedQuery}&quot;
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
