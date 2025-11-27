library(ggvenn)
library(tidyr)
library(dplyr)

master_table <- read.csv("/Users/pacha/Documents/github_projects/test_tsspredatorGui/TSSpredator-GUI/statistical_testing/data/TSSpredator-prediction_E.-coli-with-antibiotics/MasterTable.tsv", sep = "\t", header = T)

master_table_only_enriched <- master_table %>%
   filter(enriched == 1)%>% 
    select(SuperPos, SuperStrand, Condition) %>%
    distinct() %>%
group_by(SuperPos, SuperStrand) %>% 
# count unique occurrences
summarise(n = n()) %>%
mutate(number_pairwise_comparisons = n * (n -1) /2)

sum(master_table_only_enriched$number_pairwise_comparisons)
master_table_only_enriched %>% filter(n >1) %>% nrow()
head(master_table_only_enriched)


ks <- read.csv("results_ks_pairwise_results_Ecoli.tsv", sep = ",")
nbinom <- read.csv("results_binom_pairwise_results_Ecoli.tsv", sep = ",")

ks_divided_contrast <- ks %>%
    separate(contrast, into = c("Condition1", "vs", "Condition2"), sep = " ") %>%
    select(-vs)
ks_id_per_comparison <- ks_divided_contrast %>%
    # create unique comparison id with TSS_ID and conditions ordered alphabetically
    mutate(comparison_id = ifelse(Condition1 < Condition2,
                                  paste(TSS_ID, Condition1, Condition2, sep = "_vs_"),
                                  paste(TSS_ID, Condition2, Condition1, sep = "_vs_")))
head(ks_id_per_comparison)

ks_divided_contrast_long <- ks_id_per_comparison %>%
    pivot_longer(cols = c("Condition1", "Condition2"), names_to = "Condition_type", values_to = "Condition") %>%
    separate(TSS_ID, into = c("SuperPos", "SuperStrand"), sep = "_", remove = FALSE) %>%
    mutate(SuperPos = as.integer(SuperPos))
head(ks_divided_contrast_long)
ks_divided_merged <- ks_divided_contrast_long %>%
     left_join(master_table %>% select(Condition, SuperPos, SuperStrand, enrichmentFactor) %>% distinct(), by = c("Condition", "SuperPos", "SuperStrand")) %>%
    mutate(
        enrichmentFactorValue = case_when(
      enrichmentFactor == ">100" ~ 100,
      TRUE ~ suppressWarnings(as.numeric(enrichmentFactor))
    )
       ) %>% pivot_wider(id_cols = comparison_id, names_from = Condition_type, values_from = c(enrichmentFactorValue, enrichmentFactor), names_prefix =  "EF") %>%
    filter(!(enrichmentFactor_EFCondition1 == ">100" & enrichmentFactor_EFCondition1 == enrichmentFactor_EFCondition2)) %>%
    mutate(enrichmentFactor_diff = abs(enrichmentFactorValue_EFCondition2 - enrichmentFactorValue_EFCondition1))

ks_divided_merged <- ks_divided_merged %>% mutate(found_in_both = ifelse(comparison_id %in% nbinom_id_per_comparison$comparison_id, TRUE, FALSE))

ggplot(ks_divided_merged, aes(x=found_in_both, y = enrichmentFactor_diff)) +
    # violin plot
    geom_violin( fill="lightblue") + 
    geom_boxplot(width=0.1, position=position_dodge(0.9)) +
    labs(title="Enrichment Factor Difference (KS Test)", x="Found in Both Tests", y="Enrichment Factor Difference")

head(ks_divided_merged)
nbinom_divided_contrast <- nbinom %>%
    separate(contrast, into = c("Condition1", "-", "Condition2"), sep = " ") %>%
    select(-"-")

nbinom_id_per_comparison <- nbinom_divided_contrast %>%
    # create unique comparison id with TSS_ID and conditions ordered alphabetically
    mutate(comparison_id = ifelse(Condition1 < Condition2,
                                  paste(TSS_ID, Condition1, Condition2, sep = "_vs_"),
                                  paste(TSS_ID, Condition2, Condition1, sep = "_vs_")))


nbinom_divided_contrast_long <- nbinom_id_per_comparison %>%
    pivot_longer(cols = c("Condition1", "Condition2"), names_to = "Condition_type", values_to = "Condition") %>%
    separate(TSS_ID, into = c("SuperPos", "SuperStrand"), sep = "_", remove = FALSE) %>%
    mutate(SuperPos = as.integer(SuperPos))
head(nbinom_divided_contrast_long)
nbinom_divided_merged <- nbinom_divided_contrast_long %>%
    left_join(master_table %>% select(Condition, SuperPos, SuperStrand, enrichmentFactor) %>% distinct(), by = c("Condition", "SuperPos", "SuperStrand")) %>%
    mutate(
        enrichmentFactorValue = case_when(
      enrichmentFactor == ">100" ~ 100,
      TRUE ~ suppressWarnings(as.numeric(enrichmentFactor))
    )
    ) %>% pivot_wider(id_cols = comparison_id, names_from = Condition_type, values_from = c(enrichmentFactorValue, enrichmentFactor), names_prefix =  "EF") %>%
    filter(!(enrichmentFactor_EFCondition1 == ">100" & enrichmentFactor_EFCondition1 == enrichmentFactor_EFCondition2)) %>%
    mutate(enrichmentFactor_diff = abs(enrichmentFactorValue_EFCondition2 - enrichmentFactorValue_EFCondition1))
head(nbinom_divided_merged)
boxplot(nbinom_divided_merged$enrichmentFactor_diff, main="Enrichment Factor Difference (Negative Binomial Test)", ylab="Enrichment Factor Difference")

nbinom_divided_merged %>% filter(TSS_ID == "1002989_+") %>% select(-estimate, -SE, -df, -z.ratio, -SuperPos, -SuperStrand)
    mutate(
    enrichmentFactorValue = case_when(
      enrichmentFactor == ">100" ~ 100,
      TRUE ~ suppressWarnings(as.numeric(enrichmentFactor))
    )
  ) %>%
  pivot_wider(names_from = Condition_type, values_from = enrichmentFactorValue, names_prefix = "enrichmentFactor_") 

print(head(nbinom_divided_merged%>%filter(is.na(enrichmentFactor_Condition1) | is.na(enrichmentFactor_Condition2)) %>% select(TSS_ID, enrichmentFactor_Condition1, enrichmentFactor_Condition2)))

print(nbinom_divided_merged$enrichmentFactor_diff)
ggvenn(
  data = list(
    "KS Test" = unique(ks_id_per_comparison$comparison_id),
    "Negative Binomial Test" = unique(nbinom_id_per_comparison$comparison_id)
  ),
  fill_color = c("#0073C2FF", "#EFC000FF", "#868686FF", "#CD534CFF"),
  stroke_size = 0.5, set_name_size = 4
  )



only_ks <- setdiff(unique(ks$TSS_ID), unique(nbinom$TSS_ID))
head(only_ks)
