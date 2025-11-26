import { MenuProcessingResult } from '@menu-ai/shared-types';
import { motion } from 'framer-motion';
import './ResultsPanel.css';

interface ResultsPanelProps {
    results: MenuProcessingResult;
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
    const { vegetarian_items, total_sum, uncertainty_card } = results;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-panel glass"
        >
            <div className="results-header">
                <h2>🌱 Vegetarian Items Found</h2>
                <div className="total-badge">
                    <span className="total-label">Total:</span>
                    <span className="total-amount gradient-text">${total_sum.toFixed(2)}</span>
                </div>
            </div>

            {vegetarian_items.length === 0 ? (
                <div className="empty-state">
                    <p>No vegetarian items detected in this menu.</p>
                </div>
            ) : (
                <div className="items-list">
                    {vegetarian_items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="item-card"
                        >
                            <div className="item-header">
                                <h3>{item.name}</h3>
                                <span className="item-price">${item.price.toFixed(2)}</span>
                            </div>

                            {item.description && (
                                <p className="item-description">{item.description}</p>
                            )}

                            {item.classification && (
                                <div className="item-meta">
                                    <div className="confidence-bar">
                                        <div
                                            className="confidence-fill"
                                            style={{ width: `${item.classification.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="confidence-label">
                                        {(item.classification.confidence * 100).toFixed(0)}% confident
                                    </span>
                                    {item.classification.reasoning && (
                                        <p className="reasoning">{item.classification.reasoning}</p>
                                    )}
                                    {item.classification.flags.length > 0 && (
                                        <div className="flags">
                                            {item.classification.flags.map((flag, i) => (
                                                <span key={i} className="flag">⚠️ {flag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {uncertainty_card && uncertainty_card.requires_review && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="uncertainty-card"
                >
                    <h4>⚠️ Manual Review Recommended</h4>
                    <p>Some items have ambiguous ingredients and need human verification.</p>
                    <ul>
                        {uncertainty_card.flagged_items.map((item: any, i: number) => (
                            <li key={i}>{item.reason || 'Uncertain classification'}</li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </motion.div>
    );
}
