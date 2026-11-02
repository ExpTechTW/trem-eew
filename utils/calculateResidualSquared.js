/**
 * 計算加權的殘差平方和。
 *
 * 參數意義：
 * - observedTimes[i]       ： 第 i 筆的「觀測值」或「由觀測推得的時間」(例如 eq_t)
 * - observedTimeSource     ： 相當於 (T_{o_s})，整個事件的觀測起震時刻；可設定為 eew() 內計算出的平均 eq_time
 * - theoreticalTimes[i]    ： 第 i 筆的「理論值」(若不需要分測站理論值，亦可全部設成 0)
 * - theoreticalTimeSource  ： (T_{c_s})，若沒有用到，可設為 0
 * - weights[i]             ： 第 i 筆資料的權重 w[i]
 *
 * 回傳：
 *   \sum_i ( residual_i^2 * weights[i] ) ，
 *   其中 residual_i = (observedTimes[i] - observedTimeSource) - (theoreticalTimes[i] - theoreticalTimeSource)
 */
function calculateWeightedResidualSquared(
	observedTimes,
	observedTimeSource,
	theoreticalTimes,
	theoreticalTimeSource,
	weights,
) {
	let sum = 0;
	for (let i = 0; i < observedTimes.length; i++) {
		// (T_{o_i} - T_{o_s}) - (T_{c_i} - T_{c_s})
		const residual =
        (observedTimes[i] - observedTimeSource) -
        (theoreticalTimes[i] - theoreticalTimeSource);

		sum += residual * residual * weights[i];
	}

	return sum;
}

module.exports = calculateWeightedResidualSquared;